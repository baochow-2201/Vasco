import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import api, { BASE } from './api';

const ChatSocket = ({ goBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [privateMessages, setPrivateMessages] = useState(() => {
    // Load cached messages from localStorage on mount
    try {
      const cached = localStorage.getItem('chatMessages');
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  });
  const [chatMode, setChatMode] = useState("public");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);
  const scrollDebounceRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const friendsFetchedRef = useRef(false);
  const friendsByIdRef = useRef({});
  const msgBufferRef = useRef({});
  const flushTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  const getToken = () => localStorage.getItem("token");

  // Get currentUserId safely
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.id);
      } catch (err) {
        console.error("Invalid token:", err);
      }
    }
  }, []);

  // Save private messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('chatMessages', JSON.stringify(privateMessages));
    } catch (e) {
      console.warn('Failed to save chat messages to localStorage:', e);
    }
  }, [privateMessages]);

  const scrollToBottom = () => {
    // Debounced auto scroll (avoid heavy smooth animation when many messages arrive quickly)
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    scrollDebounceRef.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, privateMessages]);

  const fetchFriends = async () => {
    try {
      // Fetch both friends and conversations
      const [friendsData, conversationsData] = await Promise.all([
        api.fetchFriends(),
        api.fetchConversations()
      ]);
      
      console.log('📋 fetchFriends result:', { friendsData, conversationsData });
      
      // Handle friends
      const friendshipsArray = Array.isArray(friendsData) ? friendsData : (friendsData.friends || friendsData.data || []);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = currentUser.id;
      
      console.log('👤 Current user ID:', currentUserId);
      console.log('👥 Friendships array length:', friendshipsArray.length);
      
      // Transform friendships to friends by extracting the other user
      const friendsList = friendshipsArray.map(friendship => {
        const friend = friendship.user1_id === currentUserId ? friendship.user2 : friendship.user1;
        return {
          ...friend,
          friend_since: friendship.createdAt,
        };
      }).filter(Boolean);
      
      console.log('👫 Friends list:', friendsList.map(f => ({ id: f.id, username: f.username })));
      
      // Handle conversations - extract participants who are not current user
      const conversationsList = Array.isArray(conversationsData) ? conversationsData : (conversationsData.data || []);
      console.log('💬 Conversations list:', conversationsList.length, 'conversations');
      
      const conversationPartners = conversationsList.flatMap(conv => {
        const users = conv.Users || [];
        console.log(`  - Conversation ${conv.id} has ${users.length} users:`, users.map(u => ({ id: u.id, username: u.username })));
        return users
          .filter(u => u.id !== currentUserId)
          .map(u => ({
            ...u,
            from_conversation: true,
            conversation_id: conv.id,
          }));
      }).filter(Boolean);
      
      console.log('🗣️ Conversation partners:', conversationPartners.map(cp => ({ id: cp.id, username: cp.username, conv_id: cp.conversation_id })));
      
      // Merge friends and conversation partners (avoid duplicates by id)
      const allPartnerIds = new Set();
      const mergedList = [];
      
      // Add friends first
      friendsList.forEach(f => {
        allPartnerIds.add(f.id);
        mergedList.push(f);
      });
      
      // Add conversation partners not already in friends list
      conversationPartners.forEach(cp => {
        if (!allPartnerIds.has(cp.id)) {
          mergedList.push(cp);
        }
      });
      
      console.log('✅ Final merged list:', mergedList.length, 'partners', mergedList.map(p => ({ id: p.id, username: p.username })));
      
      setFriends(mergedList);
      const byId = {};
      for (const f of mergedList) byId[f.id] = f;
      friendsByIdRef.current = byId;
    } catch (err) {
      console.error('Error fetching friends and conversations:', err);
    }
  };

  const fetchPrivateMessages = async (friendId) => {
    try {
      const data = await api.fetchPrivateMessages(friendId);
      const messages = data.messages || [];
      const conversationId = data.conversation_id;
      
      // Normalize messages to include `from` (sender profile) for UI
      const normalized = messages.map(m => ({
        ...m,
        from: m.from || m.sender || friendsByIdRef.current[m.sender_id] || { id: m.sender_id }
      }));
      
      // Store messages
      setPrivateMessages((prev) => ({ ...prev, [friendId]: normalized }));
      
      // Join conversation room if we have conversation_id
      if (conversationId && socketRef.current?.connected) {
        socketRef.current.emit("join:conversation", conversationId);
      } else if (!conversationId && messages.length > 0) {
        // Fallback: try to get conversationId from first message
        const fallbackConvId = messages[0]?.conversation_id;
        if (fallbackConvId && socketRef.current?.connected) {
          socketRef.current.emit("join:conversation", fallbackConvId);
        }
      }
    } catch (err) {
      console.error('Error fetching private messages:', err);
    }
  };

  const sendPrivateMessage = async (receiverId, text, mediaUrl = null) => {
    try {
      const data = await api.sendPrivateMessage(receiverId, text, mediaUrl);
      if (data && data.data) {
        // Backend returns { data: fullMessage, conversation_id }
        const message = data.data || {};
        const conversationId = data.conversation_id;
        
        // Ensure message has 'from' field with current user info
        if (!message.from) {
          const currentUserData = JSON.parse(localStorage.getItem('user') || '{}');
          message.from = {
            id: message.sender_id || currentUserId,
            username: currentUserData.username || currentUserData.display_name,
            display_name: currentUserData.display_name || currentUserData.username,
            avatar_url: currentUserData.user_profile?.avatar_url || currentUserData.avatar_url
          };
        }
        
        // Add message to state
        setPrivateMessages((prev) => {
          const existing = prev[receiverId] || [];
          // Prevent duplicates
          if (existing.some(m => m.id === message.id)) {
            return prev;
          }
          return {
            ...prev,
            [receiverId]: [...existing, message],
          };
        });

        // Join conversation room after sending if not already in
        if (conversationId && socketRef.current?.connected) {
          socketRef.current.emit("join:conversation", conversationId);
        }
      }
    } catch (err) {
      console.error('Error sending private message:', err);
    }
  };

  // Socket initialization effect
  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }

    // Prevent creating multiple socket instances if one already exists
    if (socketRef.current && socketRef.current.connected) {
      return;
    }

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const newSocket = io(BASE, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      // Attempt to auto-join user room to receive notifications
      try {
        newSocket.emit('join:user', {});
      } catch (e) {
        // ignore
      }
    });
    newSocket.on("disconnect", (reason) => {
      setIsConnected(false);
      if (reason === "io server disconnect") newSocket.connect();
    });
    newSocket.on("connect_error", (err) => {
      setIsConnected(false);
      console.warn('Socket connect_error', err?.message || err);
    });
    newSocket.on('reconnect', (attempt) => {
      console.info('Socket reconnected after attempt', attempt);
      setIsConnected(true);
    });
    newSocket.on('reconnect_attempt', (attempt) => {
      console.info('Socket reconnect attempt', attempt);
    });
    newSocket.on('reconnect_error', (err) => {
      console.warn('Socket reconnect_error', err?.message || err);
    });
    newSocket.on('reconnect_failed', () => {
      console.error('Socket reconnect failed after max attempts.');
    });
    newSocket.on('error', (err) => {
      console.error('Socket error:', err?.message || err);
    });

    newSocket.on("message", (msg) => {
      // Prevent duplicates: only add if message doesn't already exist
      setMessages((prev) => {
        // Check by ID first (most reliable)
        if (msg.id && prev.some(m => m.id === msg.id)) {
          return prev;
        }
        // Check by timestamp + sender for extra safety
        if (msg.created_at && msg.sender_id) {
          const exists = prev.some(m => 
            m.created_at === msg.created_at && 
            m.sender_id === msg.sender_id &&
            (m.text === msg.text || m.content === msg.content)
          );
          if (exists) {
            return prev;
          }
        }
        // Add new message
        return [...prev, msg];
      });
    });

    newSocket.on("presence", setOnlineUsers);

    newSocket.on("private_message", (data) => {
      const { message, sender_id, receiver_id } = data;
      // Normalize message: ensure `from` exists replacing with friend info if needed
      if (message && !message.from) {
        message.from = friendsByIdRef.current[sender_id] || friends.find((f) => f.id === sender_id) || { id: sender_id };
      }
      
      // Update for received messages
      if (currentUserId && receiver_id === currentUserId) {
        const friendId = sender_id;
        // Buffer message to avoid frequent re-renders
        pushToBuffer(String(friendId), message);
        if (!selectedFriend || selectedFriend.id !== friendId) {
          const friend = friendsByIdRef.current[friendId] || friends.find((f) => f.id === friendId);
          if (friend) {
            // Show browser notification
            if ("Notification" in window && Notification.permission === "granted") {
              const notification = new Notification(`Tin nhắn từ ${friend?.display_name || friend?.username || 'Người dùng'}`, {
                  body: message.text || "Đã gửi hình ảnh",
                  icon: friend?.user_profile?.avatar_url || friend?.avatar_url || "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/kw5jvhez_expires_30_days.png",
                  tag: `private-message-${friendId}`,
                });
              setTimeout(() => notification.close(), 5000);
            }
          }
        }
      }
      
      // Update for sent messages (in case socket confirms our sent message)
      if (currentUserId && sender_id === currentUserId && receiver_id !== currentUserId) {
        // Buffer self-sent message as confirmed
        pushToBuffer(String(receiver_id), message);
      }
    });

    // 🔥 Listen for real-time trigger-based messages (instant delivery)
    const flushMessageBuffer = () => {
      const buffered = msgBufferRef.current;
      if (!buffered || Object.keys(buffered).length === 0) return;
      setPrivateMessages((prev) => {
        const updated = { ...prev };
        for (const [friendIdStr, msgs] of Object.entries(buffered)) {
          const friendId = Number(friendIdStr);
          const existingIds = new Set((updated[friendId] || []).map(m => m.id));
          const nonDup = msgs.filter(m => !existingIds.has(m.id));
          updated[friendId] = [...(updated[friendId] || []), ...nonDup];
        }
        return updated;
      });
      // Clear buffer
      msgBufferRef.current = {};
      flushTimeoutRef.current = null;
    };

    const pushToBuffer = (friendId, messageObj) => {
      if (!msgBufferRef.current[friendId]) msgBufferRef.current[friendId] = [];
      // dedupe within buffer
      if (msgBufferRef.current[friendId].some(m => m.id === messageObj.id)) return;
      msgBufferRef.current[friendId].push(messageObj);
      if (!flushTimeoutRef.current) {
        flushTimeoutRef.current = setTimeout(flushMessageBuffer, 50);
      }
    };

    const handleTriggerMessage = (incoming) => {
      // Normalize payload (data.message or data)
      const messageData = incoming.message || incoming;

      // Enrich message with sender 'from' info if available from payload or local friends cache
      const fromInfo = messageData.from || friendsByIdRef.current[messageData.sender_id] || friends.find((f) => f.id === messageData.sender_id) || null;

      const buildMessageObj = () => ({
        id: messageData.id,
        sender_id: messageData.sender_id,
        receiver_id: messageData.receiver_id,
        content: messageData.content,
        text: messageData.content,
        media_url: messageData.media_url,
        created_at: messageData.created_at,
        from: fromInfo,
        source: "trigger",
      });

      // Private message received by current user
      if (currentUserId && messageData.receiver_id === currentUserId) {
        const senderId = messageData.sender_id;
        const messageObj = buildMessageObj();
        // Use buffered update to reduce frequent re-renders
        pushToBuffer(String(senderId), messageObj);

        if (!selectedFriend || selectedFriend.id !== senderId) {
          const friend = friendsByIdRef.current[senderId] || friends.find((f) => f.id === senderId);
          if (friend && "Notification" in window && Notification.permission === "granted") {
            const notification = new Notification(`💬 ${friend?.display_name || friend?.username || 'Người dùng'}`, {
              body: messageData.content || "Đã gửi hình ảnh",
              icon: friend?.user_profile?.avatar_url || friend?.avatar_url || "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/kw5jvhez_expires_30_days.png",
              tag: `trigger-message-${senderId}`,
            });
            setTimeout(() => notification.close(), 5000);
          }
        }
      }

      // Private message confirmation for sender (self-sent message saved via trigger)
      if (currentUserId && messageData.sender_id === currentUserId && messageData.receiver_id !== currentUserId) {
        const receiverId = messageData.receiver_id;
        const messageObj = buildMessageObj();
        // Use buffered update to reduce frequent re-renders for sender
        pushToBuffer(String(receiverId), messageObj);
      }
    };

    newSocket.on("receive:message", handleTriggerMessage);

    // Also listen for new:message event
    newSocket.on("new:message", (data) => {
      handleTriggerMessage(data);
    });

    socketRef.current = newSocket;
    
    // Cleanup: only disconnect if component is unmounting
    return () => {
      // Only disconnect if socket still exists
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentUserId && !friendsFetchedRef.current) {
      fetchFriends();
      friendsFetchedRef.current = true;
    }
  }, [currentUserId]);

  // Note: Auto-restore of lastSelectedFriend disabled to prevent navigation issues
  // Users will explicitly select a friend from the friend list when entering chat

  useEffect(() => {
    if (!selectedFriend) return;
    const friendKey = String(selectedFriend.id);
    const buffered = msgBufferRef.current[friendKey];
    if (buffered && buffered.length > 0) {
      // Move them into state immediately
      setPrivateMessages((prev) => ({
        ...prev,
        [selectedFriend.id]: [...(prev[selectedFriend.id] || []), ...buffered.filter(m => !(prev[selectedFriend.id] || []).some(pm => pm.id === m.id))]
      }));
      // clear buffer for this friend
      msgBufferRef.current[friendKey] = [];
    }
  }, [selectedFriend]);

  useEffect(() => {
    if (chatMode === 'public') {
      api.fetchPublicMessages().then((data) => setMessages(data.messages || [])).catch(console.error);
    }
  }, [chatMode]);

  useEffect(() => {
    if (selectedFriend && chatMode === "private") {
      // Fetch messages for this friend (don't wait for socket to be connected)
      if (!privateMessages[selectedFriend.id]) {
        fetchPrivateMessages(selectedFriend.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFriend, chatMode]);

  const sendMessage = () => {
    if (!input.trim()) return;
    if (chatMode === "public" && socketRef.current) {
      // Send via API for persistence (backend will also broadcast via socket)
      api.sendPublicMessage(input).then(res => {
        if (res.data) {
          // Add message immediately from API response
          setMessages(prev => {
            // Check if message already exists (in case socket broadcast arrives first)
            if (res.data.id && prev.some(m => m.id === res.data.id)) {
              return prev;
            }
            return [...prev, {
              id: res.data.id,
              text: res.data.text,
              media_url: res.data.media_url,
              sender_id: res.data.sender_id,
              from: res.data.from,
              created_at: res.data.created_at
            }];
          });
        }
      }).catch(err => console.error("❌ Error sending public message:", err));
      
      setInput("");
    } else if (chatMode === "private" && selectedFriend) {
      sendPrivateMessage(selectedFriend.id, input);
      setInput("");
    }
  };

  const handleKeyPress = (e) => e.key === "Enter" && sendMessage();

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => sendImageMessage(e.target.result);
      reader.readAsDataURL(file);
    }
  };
  const handleCameraCapture = handleImageSelect;

  const sendImageMessage = async (imageData) => {
    try {
      // Upload image to Cloudinary via backend
      const uploadResponse = await api.uploadMessageImage(imageData);
      if (!uploadResponse || !uploadResponse.url) {
        console.error('Failed to upload image');
        return;
      }

      const mediaUrl = uploadResponse.url;

      if (chatMode === "public" && socketRef.current) {
        socketRef.current.emit("message", { text: "", media_url: mediaUrl, message_type: "image" });
      } else if (chatMode === 'private' && selectedFriend) {
        await sendPrivateMessage(selectedFriend.id, '', mediaUrl);
      }
    } catch (err) {
      console.error('Error sending image message:', err);
    }
  };

  const deleteMessage = async (messageId, isPrivate = false) => {
    try {
      await api.deleteMessage(messageId, isPrivate);
      if (isPrivate && selectedFriend) {
        setPrivateMessages((prev) => ({
          ...prev,
          [selectedFriend.id]: prev[selectedFriend.id].filter((msg) => msg.id !== messageId),
        }));
      } else {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const currentMessages =
    chatMode === "public"
      ? messages
      : selectedFriend
      ? privateMessages[selectedFriend.id] || []
      : [];

  return (
    <div className="h-full flex bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col shadow-sm overflow-hidden`}>
        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Tin nhắn</h2>
              <p className="text-xs text-blue-100">{onlineUsers.length} online</p>
            </div>
            <button onClick={() => goBack()} className="hover:bg-blue-700 p-1 rounded-lg transition-colors" title="Quay lại">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="px-3 py-3 border-b border-slate-200 bg-slate-50 flex gap-2">
          <button
            onClick={() => setChatMode("public")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              chatMode === "public"
                ? "bg-blue-500 text-white shadow-md scale-105"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Chung
          </button>
          <button
            onClick={() => setChatMode("private")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              chatMode === "private"
                ? "bg-blue-500 text-white shadow-md scale-105"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Riêng
          </button>
        </div>

        {/* Friend list */}
        <div className="flex-1 overflow-y-auto px-2 py-3">
          {chatMode === "private" && friends.length > 0 ? (
            friends.map((friend) => {
              const isSelected = selectedFriend?.id === friend.id;
              const unreadCount = (privateMessages[friend.id] || []).length;
              const isOnline = onlineUsers.some((u) => u.id === friend.id);
              return (
                <button
                  key={friend.id}
                  onClick={() => {
                    setSelectedFriend(friend);
                    // persist last selected friend so we can restore on reload
                    try { localStorage.setItem('lastSelectedFriend', JSON.stringify({ id: friend.id, display_name: friend.display_name })); } catch(e) {}
                    // Always fetch messages when selecting a friend to get latest messages
                    fetchPrivateMessages(friend.id);
                  }}
                  className={`w-full p-3 mb-2 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                    isSelected 
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg" 
                      : "bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                      <img loading="lazy"
                        src={friend?.user_profile?.avatar_url || friend?.avatar_url || "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/kw5jvhez_expires_30_days.png"}
                        alt="avatar" 
                        className={`w-12 h-12 rounded-full object-cover ${isSelected ? "ring-2 ring-white" : "ring-2 ring-slate-200"}`} 
                      />
                    {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="font-semibold text-sm truncate">{friend.display_name || friend.username}</h4>
                    <p className={`text-xs truncate ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                      {unreadCount > 0 ? `${unreadCount} tin nhắn` : "Chưa có tin"}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${isSelected ? "bg-white text-blue-600" : "bg-red-500 text-white"}`}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center py-12 text-slate-500">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-2 text-slate-400">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <div className="text-sm font-medium mb-1">
                {chatMode === "private" ? "Chưa có bạn bè" : "Chat chung"}
              </div>
              <div className="text-xs text-slate-400">{onlineUsers.length} người online</div>
            </div>
          )}
        </div>

        {/* Connection status */}
        <div className="px-3 py-2 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className="text-slate-600">{isConnected ? "Đã kết nối" : "Đang kết nối..."}</span>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="hover:bg-slate-100 p-2 rounded-lg transition-colors"
              title={sidebarOpen ? "Ẩn sidebar" : "Hiển thị sidebar"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            {chatMode === "private" && selectedFriend ? (
              <>
                <div className="relative">
                  <img loading="lazy" src={selectedFriend?.user_profile?.avatar_url || selectedFriend?.avatar_url || "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/kw5jvhez_expires_30_days.png"} alt="avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200" />
                  {onlineUsers.some((u) => u.id === selectedFriend?.id) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{selectedFriend?.display_name || selectedFriend?.username}</h3>
                  <p className="text-xs text-slate-500">{onlineUsers.some((u) => u.id === selectedFriend?.id) ? "🟢 Online" : "🔘 Offline"}</p>
                </div>
              </>
            ) : (
              <div>
                <h3 className="font-semibold text-slate-900">Chat chung</h3>
                <p className="text-xs text-slate-500">{onlineUsers.length} người đang online</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button className="hover:bg-slate-100 p-2 rounded-lg transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            {currentMessages.map((msg, idx) => {
              const isCurrentUser = msg.sender_id === currentUserId || msg.from?.id === currentUserId;
              const displayName = msg.from?.display_name || msg.from?.username || 'Người dùng';
              const messageText = msg.text || msg.content || '';
              const timeStr = msg.created_at 
                ? new Date(msg.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                : '';
              
              // Generate unique key: use id if available, otherwise use timestamp + sender_id + index
              const messageKey = msg.id 
                ? `msg-${msg.id}` 
                : `temp-${msg.created_at || Date.now()}-${msg.sender_id}-${idx}`;
              
              return (
                <div key={messageKey} className={`flex gap-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  {!isCurrentUser && (
                    <img loading="lazy"
                      src={msg.from?.user_profile?.avatar_url || msg.from?.avatar_url || (friendsByIdRef.current[msg.sender_id]?.user_profile?.avatar_url) || "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/kw5jvhez_expires_30_days.png"}
                      alt="avatar" 
                      className="w-8 h-8 rounded-full flex-shrink-0 object-cover ring-2 ring-slate-100" 
                    />
                  )}
                  <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
                    {chatMode === "public" && !isCurrentUser && (
                      <span className="text-xs font-semibold text-slate-600 mb-1 px-3">{displayName}</span>
                    )}
                    <div className="flex gap-2 items-end max-w-xs lg:max-w-md">
                      <div className={`relative group px-4 py-2 rounded-2xl shadow-sm transition-all ${
                        isCurrentUser 
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none" 
                          : "bg-white text-slate-900 rounded-bl-none border border-slate-200"
                      }`}>
                        {msg.media_url ? (
                          <img loading="lazy"
                            src={msg.media_url} 
                            alt="Shared" 
                            className="max-w-sm max-h-64 rounded-lg cursor-pointer hover:opacity-80 transition-opacity" 
                            onClick={() => window.open(msg.media_url, "_blank")} 
                          />
                        ) : (
                          <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">{messageText}</div>
                        )}
                        {isCurrentUser && msg.id && (
                          <button 
                            onClick={() => deleteMessage(msg.id, chatMode === "private")} 
                            className="absolute -top-3 -right-3 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1.5 shadow-md hover:shadow-lg"
                            title="Xóa tin nhắn"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 3v1H5v2h1v13a2 2 0 002 2h8a2 2 0 002-2V6h1V4h-4V3H9m0 5v9m4-9v9" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    {msg.created_at && (
                      <span className="text-xs text-slate-400 mt-1 px-3">{timeStr}</span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-slate-200 px-4 py-4">
          <div className="flex gap-2 items-end bg-slate-50 rounded-xl p-3 border border-slate-200 hover:border-slate-300 transition-colors">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="text-slate-600 hover:text-blue-500 p-2 rounded-lg hover:bg-slate-200 transition-all"
              disabled={chatMode === "private" && !selectedFriend}
              title="Gửi file"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
            </button>
            <button 
              onClick={() => cameraInputRef.current?.click()} 
              className="text-slate-600 hover:text-blue-500 p-2 rounded-lg hover:bg-slate-200 transition-all"
              title="Chụp ảnh"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageSelect} />
            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleCameraCapture} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-400"
              disabled={chatMode === "private" && !selectedFriend}
            />
            <button 
              onClick={sendMessage} 
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold transition-all ${
                !input.trim() || (chatMode === "private" && !selectedFriend)
                  ? "text-slate-400 cursor-not-allowed"
                  : "text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg active:scale-95"
              }`}
              disabled={!input.trim() || (chatMode === "private" && !selectedFriend)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346272 C3.50612381,0.9 2.40987166,0.99 1.77946707,1.4870672 C0.994623095,2.11604706 0.837654326,3.20600048 1.15159189,3.99148738 L3.03521743,10.4324804 C3.03521743,10.5895777 3.34915502,10.7466751 3.50612381,10.7466751 L16.6915026,11.5321619 C16.6915026,11.5321619 17.1624089,11.5321619 17.1624089,12.0009496 C17.1624089,12.4697733 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSocket;
