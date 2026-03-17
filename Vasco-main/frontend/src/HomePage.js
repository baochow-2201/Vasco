import React, { useState, useEffect, useCallback } from "react";
import FriendList from "./FriendList";
import NotificationList from "./NotificationList";
// ChatSocket intentionally not used here; kept for future use
import io from 'socket.io-client';
import api, { BASE } from './api';

const DEBUG = process.env.REACT_APP_DEBUG === 'true';
const dlog = (...args) => { if (DEBUG) console.log(...args); };

// Helper function - outside component to avoid dependency issues
const getDisplayName = (user) => {
  if (!user) return 'Người dùng';
  // Ưu tiên lấy từ user_profile.full_name (dữ liệu mới nhất từ database)
  return (user.user_profile?.full_name && user.user_profile.full_name.trim()) || 
         (user.full_name && user.full_name.trim()) || 
         user.display_name || 
         user.username || 
         user.name || 
         'Người dùng';
};

export default function HomePage() {
  const [screen, setScreen] = useState("newfeed");
  // const [input1, onChangeInput1] = useState('');
  const [input2, onChangeInput2] = useState('');
  const [toast, setToast] = useState(null);
  // Keep user to show avatar/name in the UI
  const [user, setUser] = useState(null);
  const [commentsMap, setCommentsMap] = useState({}); // { postId: [comments] }
  const [commentInputs, setCommentInputs] = useState({}); // { postId: 'text' }
  const [posts, setPosts] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const fileInputRef = React.useRef(null);
  const [reportModal, setReportModal] = useState(null); // { type: 'post'|'comment', id, postId }
  const [reportReason, setReportReason] = useState('');
  const [reactionsMap, setReactionsMap] = useState({}); // { postId: count }
  const [userLikes, setUserLikes] = useState(new Set()); // Set of post IDs user has liked
  const [otherUserProfile, setOtherUserProfile] = useState(null); // Profile người dùng khác đang xem
  const [otherUserPosts, setOtherUserPosts] = useState([]); // Posts của người dùng khác

  // We keep the socket connection local to effect; we don't need to keep it in state

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const viewUserProfile = useCallback(async (userId) => {
    try {
      if (user && userId === user.id) {
        // Nếu là chính mình thì chuyển sang tab profile
        setScreen('profile');
        return;
      }
      dlog('Loading profile for user:', userId);
      const profileData = await api.getUserProfile(userId);
      dlog('Profile data:', profileData);
      setOtherUserProfile({
        id: userId,
        ...profileData
      });
      
      dlog('Fetching posts for user:', userId);
      const postsData = await api.getUserPosts(userId);
      dlog('Posts data from API:', postsData);
      
      // Handle different response formats
      let postsList = [];
      if (Array.isArray(postsData)) {
        postsList = postsData;
      } else if (postsData?.data?.posts) {
        postsList = postsData.data.posts;
      } else if (postsData?.data && Array.isArray(postsData.data)) {
        postsList = postsData.data;
      } else if (postsData?.posts && Array.isArray(postsData.posts)) {
        postsList = postsData.posts;
      }
      
      dlog('Processed posts list length:', postsList.length);
      dlog('Posts belong to user IDs:', postsList.map(p => p.user_id || p.user?.id));
      
      // Filter to ensure only this user's posts
      const filteredPosts = postsList.filter(p => {
        const postUserId = p.user_id || p.user?.id;
        const isOwned = postUserId === userId;
        if (!isOwned) {
          console.warn(`Filtered out post ${p.id} - user_id: ${postUserId}, target: ${userId}`);
        }
        return isOwned;
      });
      
      dlog('Filtered posts list length:', filteredPosts.length);
      setOtherUserPosts(filteredPosts);
    } catch (err) {
      console.error('Error loading user profile:', err);
      showToast('Không thể tải hồ sơ người dùng');
    }
  }, [user]);

  const submitReport = async (type, targetId) => {
    if (!reportReason.trim()) {
      showToast('Vui lòng nhập lý do báo cáo');
      return;
    }
    try {
      const payload = {
        type,
        targetId,
        reason: reportReason.trim(),
        postId: type === 'comment' ? reportModal.postId : undefined
      };
      const response = await api.createReport(payload);
      if (response && response.id) {
        showToast('Báo cáo đã được gửi, cảm ơn bạn!');
        setReportModal(null);
        setReportReason('');
      } else if (response && response.error) {
        showToast(`Lỗi: ${response.error}`);
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      showToast('Lỗi khi gửi báo cáo');
    }
  };

  // Check if user clicked from search results to view profile
  useEffect(() => {
    const viewUserData = sessionStorage.getItem('viewUserProfile');
    if (viewUserData) {
      try {
        const userData = JSON.parse(viewUserData);
        viewUserProfile(userData.id);
        sessionStorage.removeItem('viewUserProfile');
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, [viewUserProfile]);

  // Setup socket connection on mount only
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    let isMounted = true; // Track if component is mounted
    let newSocket = null;
    
    if (savedUser && savedToken) {
      const parsedUser = JSON.parse(savedUser);
      
      // Async IIFE to ensure profile is fetched before posts
      (async () => {
        try {
          // Fetch fresh user profile from database to ensure avatar_url and full_name are up to date
          const profileData = await api.getUserProfile(parsedUser.id);
          if (!isMounted) return;
          
          const mergedUser = {
            ...parsedUser,
            display_name: profileData.full_name?.trim() || parsedUser.display_name || parsedUser.username,
            user_profile: {
              full_name: profileData.full_name || '',
              avatar_url: profileData.avatar_url || '',
              bio: profileData.bio || ''
            }
          };
          localStorage.setItem('user', JSON.stringify(mergedUser));
          setUser(mergedUser);
          dlog('✅ User profile loaded and stored:', mergedUser.display_name);
        } catch (err) {
          console.error('⚠️ Error fetching user profile on mount:', err);
          // Fallback to localStorage data
          if (isMounted) setUser(parsedUser);
        }
      })();
      
      // Hàm fetch posts từ server
      const fetchPostsFromServer = async () => {
        try {
          const data = await api.fetchPosts();
          dlog('Fetched posts response:', data);
          if (!isMounted) return [];
          
          // Response format: { success: true, message: "...", data: { posts: [...] } }
          const postsList = data.data?.posts || data.posts || [];
          dlog('Posts list length:', postsList.length);
          dlog('First post user:', postsList[0]?.user?.id);
          const normalized = (postsList || []).map((p, idx) => {
            dlog(`[Post ${idx}] User id:`, p.user?.id);
            dlog(`[Post ${idx}] Has profile avatar:`, Boolean(p.user?.user_profile?.avatar_url));
            const nm = getDisplayName(p.user) || p.author || p.name || 'Người dùng';
            dlog(`[Post ${idx}] Display name result: "${nm}"`);
            const avatar = p.user?.user_profile?.avatar_url || p.user?.avatar_url || "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/oadiyd0v_expires_30_days.png";
            const postMediaArray = p.post_media || p.postMedia || [];
            const images = postMediaArray.map(pm => pm.media?.url || pm.media?.public_id).filter(Boolean);
            const text = p.text || p.content || '';
            const User = p.user; // Normalize for consistency
            return { ...p, name: nm, avatar, images, text, User };
          });
          if (isMounted) setPosts(normalized);
          return normalized;
        } catch (err) {
          console.error('Error fetching posts:', err);
          return [];
        }
      };
      
      try {
        newSocket = io(BASE, {
          auth: { token: savedToken },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          reconnectionDelayMax: 5000,
        });
        
        // Only setup listeners if component is still mounted
        if (!isMounted) {
          if (newSocket && newSocket.connected) newSocket.disconnect();
          return;
        }
        
        // Load posts from server on initial load
        fetchPostsFromServer().then(normalized => {
          if (!isMounted) return;
          
          // Fetch reactions for all posts in parallel with Promise.all instead of forEach
          Promise.all(normalized.map(p =>
            api.fetchReactions(p.id)
              .then(reactions => {
                if (!isMounted) return;
                const reactionsList = Array.isArray(reactions) ? reactions : reactions.data || [];
                setReactionsMap(prev => ({ ...prev, [p.id]: reactionsList.length }));
                
                // Check if current user has liked this post
                if (parsedUser && reactionsList.some(r => r.user_id === parsedUser.id)) {
                  setUserLikes(prev => new Set([...prev, p.id]));
                }
              })
              .catch(e => console.error('Error fetching reactions for post', p.id, e))
          )).catch(() => {});
          
          // Fetch comments for all posts in parallel with Promise.all
          Promise.all(normalized.map(p =>
            api.fetchComments(p.id)
              .then(cRes => {
                if (!isMounted) return;
                setCommentsMap(prev => ({ ...prev, [p.id]: cRes.comments || [] }));
              })
              .catch(e => console.error('Error fetching comments for post', p.id, e))
          )).catch(() => {});
        });

        newSocket.on('new_post', (payload) => {
          if (!isMounted || !payload || !payload.post) return;
          
          const p = payload.post;
          // Get current user from localStorage for fallback
          const currentUser = JSON.parse(localStorage.getItem('user'));
          const userForDisplay = p.User || currentUser;
          const nm = getDisplayName(userForDisplay) || currentUser?.display_name || currentUser?.username || 'Người dùng';
          const avatar = userForDisplay?.user_profile?.avatar_url || userForDisplay?.avatar_url || currentUser?.avatar_url || "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/oadiyd0v_expires_30_days.png";
          const postMediaArray = p.post_media || p.postMedia || [];
          const images = postMediaArray.map(pm => pm.media?.url || pm.media?.public_id).filter(Boolean);
          const text = p.text || p.content || '';
          const normalized = { ...p, name: nm, avatar, text, images };
          setPosts(prev => [normalized, ...prev]);
          setCommentsMap(prev => ({ ...prev, [p.id]: [] }));
        });

        newSocket.on('new_comment', (payload) => {
          if (!isMounted || !payload || !payload.comment) return;
          
          const c = payload.comment;
          setCommentsMap(prev => {
            const list = prev[c.post_id] ? [...prev[c.post_id]] : [];
            list.push(c);
            return { ...prev, [c.post_id]: list };
          });
        });

      } catch (err) {
        console.error('❌ Socket error:', err);
        fetchPostsFromServer();
      }
    }
    
    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (newSocket && newSocket.connected) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Nếu không phải newfeed thì chuyển sang các màn khác
  if (screen === "friends") return <FriendList goBack={() => setScreen("newfeed")} />;
  if (screen === "notifications") return <NotificationList goBack={() => setScreen("newfeed")} />;

  // Show message if not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Vui lòng đăng nhập</h2>
          <p className="text-gray-600">Bạn cần đăng nhập để xem bài viết</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        {/* --- Header đã bị loại bỏ --- */}

        {/* Nội dung chính */}
        <div className="mt-[20px] px-6 flex flex-col items-center gap-6">
          {toast && (
            <div className="fixed top-[40px] right-10 bg-black text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-down">
              {toast}
            </div>
          )}
          {/* Ô đăng bài */}
          <div className="flex items-center bg-[#A2D3FF] py-3 px-6 rounded-[10px] w-full max-w-[1000px]">
            <img
              src={user?.user_profile?.avatar_url || user?.avatar || user?.avatar_url || "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/t3jnx5iy_expires_30_days.png"}
              className="w-[58px] h-[58px] mr-4"
              alt="avatar"
            />
            <input
              placeholder="Hôm nay bạn thế nào chia sẻ với tui đi!!"
              value={input2}
              onChange={(e) => onChangeInput2(e.target.value)}
              className="text-black bg-[#F6FEFF] text-xl flex-1 py-2 px-4 rounded-[50px] border-0"
            />
            <button
              className="ml-4 bg-blue-400 text-white px-4 py-2 rounded-lg"
              onClick={() => {
                if (input2.trim() !== "" || selectedImages.length > 0) {
                  // Gọi API tạo bài viết, frontend giữ nguyên UI
                  showToast(`Đang gửi bài...`);
                  api.createPost({ text: input2, media: selectedImages }).then((resp) => {
                    dlog('Create post response:', resp);
                    const postData = resp.data?.post || resp.post || {};
                    dlog('Post data:', postData);
                    if (postData && postData.id) {
                      // Clear input and show success - don't add to state here
                      // Socket new_post event will handle adding to state
                      onChangeInput2('');
                      setSelectedImages([]);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                      showToast("Bài đăng mới của bạn đã được thêm!");
                    } else {
                      showToast(resp.message || 'Không thể tạo bài viết');
                    }
                  }).catch(err => {
                    console.error('Error creating post:', err);
                    showToast('Lỗi khi gửi bài');
                  });
                }
              }}
            >
              Gửi
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setSelectedImages(files);
              }}
            />
            <button
              className="ml-2 bg-gray-200 text-black px-3 py-1 rounded-lg"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Chọn ảnh"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </button>
          </div>

          {/* Danh sách bài đăng */}
          {posts.map((post, i) => (
            <div key={i} className="flex flex-col bg-[#A2D3FF] w-full max-w-[1000px] p-4 rounded-[10px] gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={post.avatar || "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/oadiyd0v_expires_30_days.png"}
                  className="w-[58px] h-[51px] rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  alt="avatar"
                  onClick={() => viewUserProfile(post.User?.id || post.user_id)}
                  title="Xem hồ sơ"
                />
                <div className="flex flex-col flex-1">
                  <span 
                    className="text-black text-xl font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => viewUserProfile(post.User?.id || post.user_id)}
                    title="Xem hồ sơ"
                  >
                    {post.name}
                  </span>
                  <span className="text-gray-700 text-sm">@{post.User?.username || 'user'}</span>
                  <span className="text-black text-base">công khai</span>
                </div>
              </div>

              {post.text && <p className="text-black text-lg">{post.text}</p>}

              {post.images?.length > 0 && (
                <div className="flex gap-4">
                  {post.images.map((img, idx) => (
                    <img key={idx} src={img} className="w-1/2 rounded-lg" alt={`post-${idx}`} />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const postId = post.id;
                      const isCurrentlyLiked = userLikes.has(postId);
                      const action = isCurrentlyLiked ? "unlike" : "like";
                      
                      console.log(`[Like] Post ID: ${postId} | Action: ${action} | Current Reactions: ${reactionsMap[postId] || 0}`);
                      
                      api.likePost(postId)
                        .then((res) => {
                          console.log(`[Like Success] Post ID: ${postId} | Status: ${res.liked ? "LIKED" : "UNLIKED"} | Total Reactions: ${res.count || "N/A"}`);
                          
                          if (res.liked) {
                            const newCount = (reactionsMap[postId] || 0) + 1;
                            setUserLikes(prev => new Set([...prev, postId]));
                            setReactionsMap(prev => ({ ...prev, [postId]: newCount }));
                            showToast(`✅ Bạn đã like • ${newCount} lượt thích`);
                          } else {
                            const newCount = Math.max(0, (reactionsMap[postId] || 1) - 1);
                            setUserLikes(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(postId);
                              return newSet;
                            });
                            setReactionsMap(prev => ({ ...prev, [postId]: newCount }));
                            showToast(`✅ Bạn đã gỡ • ${newCount} lượt thích`);
                          }
                        })
                        .catch(err => {
                          console.error(`[Like Error] Post ID: ${postId} | Action: ${action} | Error:`, err.message);
                          showToast("Lỗi khi thích bài");
                        });
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-110 font-semibold ${
                      userLikes.has(post.id)
                        ? 'bg-red-500 text-white shadow-lg hover:bg-red-600'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    title="Thích bài viết"
                  >
                    <svg
                      className={`w-5 h-5 transition-transform duration-300 ${
                        userLikes.has(post.id) ? 'scale-125' : ''
                      }`}
                      fill={userLikes.has(post.id) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span className="text-sm font-semibold">{reactionsMap[post.id] || 0}</span>
                  </button>
                </div>
                <div className="flex-1 relative flex items-center">
                  <svg className="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                  <input
                    placeholder="Chia sẻ suy nghĩ của bạn..."
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCommentInputs(prev => ({ ...prev, [post.id]: value }));
                    }}
                    className="w-full py-2 pl-10 pr-4 rounded-full text-black border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm hover:shadow-md"
                  />
                </div>
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded-lg"
                  onClick={() => {
                    const postId = post.id;
                    const content = commentInputs[postId]?.trim();
                    if (!content) return;
                    api.createComment({ post_id: postId, content }).then(resp => {
                      if (resp && resp.comment) {
                        setCommentsMap(prev => ({ ...prev, [postId]: [...(prev[postId] || []), resp.comment] }));
                        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
                      }
                    }).catch(console.error);
                  }}
                >
                  Gửi
                </button>
                <button
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-2 shadow-md hover:shadow-lg"
                  title="Báo cáo bài viết"
                  onClick={() => setReportModal({ type: 'post', id: post.id })}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 9v2m0 4v2m-6.364-1.636l-1.414 1.414m9.956-9.956l1.414 1.414m1.414 9.956l1.414-1.414m-9.956-9.956l-1.414-1.414M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
                  </svg>
                  Báo cáo
                </button>
              </div>

              {commentsMap[post.id]?.length > 0 && (
                <div className="mt-2 ml-12 flex flex-col gap-1">
                  {commentsMap[post.id].map((cmt, idx) => (
                    <div key={cmt.id || idx} className="text-black text-sm bg-white px-2 py-1 rounded-lg">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-semibold text-xs mr-2">{(cmt.User && (cmt.User.full_name || cmt.User.username)) || cmt.author || 'Người dùng'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px]">{cmt.created_at ? new Date(cmt.created_at).toLocaleString() : ''}</span>
                          <button
                            className="text-red-500 hover:text-red-700 font-semibold text-xs p-1 hover:bg-red-50 rounded"
                            title="Báo cáo bình luận"
                            onClick={() => setReportModal({ type: 'comment', id: cmt.id, postId: post.id })}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8m-11.5 0l3.45-4.4A1 1 0 0110 3h10a3 3 0 013 3v8a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">{cmt.content || cmt}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-96 p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              Báo cáo {reportModal.type === 'post' ? 'bài viết' : 'bình luận'}
            </h2>
            <p className="text-gray-600 text-sm">
              Vui lòng cho chúng tôi biết lý do bạn báo cáo {reportModal.type === 'post' ? 'bài viết này' : 'bình luận này'}
            </p>
            <textarea
              placeholder="Nhập lý do báo cáo..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-blue-500"
              rows="4"
            />
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                onClick={() => {
                  setReportModal(null);
                  setReportReason('');
                }}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                onClick={() => submitReport(reportModal.type, reportModal.id)}
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem hồ sơ người dùng khác */}
      {otherUserProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Nút đóng */}
            <div className="sticky top-0 flex justify-end p-4 bg-white border-b">
              <button
                onClick={() => {
                  setOtherUserProfile(null);
                  setOtherUserPosts([]);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Cover image */}
            <div className="w-full h-40 bg-gradient-to-r from-blue-400 to-blue-600 object-cover">
              {otherUserProfile.cover_url && (
                <img src={otherUserProfile.cover_url} className="w-full h-full object-cover" alt="cover" />
              )}
            </div>

            {/* Avatar và thông tin */}
            <div className="px-6 pb-6">
              <div className="flex gap-4 -mt-20 mb-4 items-end">
                <img
                  src={otherUserProfile.avatar_url || "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/oadiyd0v_expires_30_days.png"}
                  className="w-32 h-32 rounded-full border-4 border-white object-cover"
                  alt="avatar"
                />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-black">{otherUserProfile.full_name || 'Người dùng'}</h1>
                  <p className="text-gray-600">@{otherUserProfile.username}</p>
                </div>
              </div>

              {otherUserProfile.bio && (
                <p className="text-gray-700 mb-4">{otherUserProfile.bio}</p>
              )}

              {/* Danh sách bài viết */}
              <div className="mt-6">
                <h2 className="text-xl font-bold text-black mb-4">Bài viết ({otherUserPosts.length})</h2>
                {otherUserPosts.length > 0 ? (
                  <div className="space-y-4">
                    {otherUserPosts.map((post) => {
                      // Normalize images from post_media
                      const postMediaArray = post.post_media || post.postMedia || [];
                      const images = postMediaArray.map(pm => pm.media?.url || pm.media?.public_id).filter(Boolean);
                      
                      return (
                        <div key={post.id} className="bg-gray-100 p-4 rounded-lg">
                          <p className="text-black">{post.text || post.content || ''}</p>
                          {(images.length > 0 || post.images?.length > 0) && (
                            <div className="mt-2 flex gap-2 flex-wrap">
                              {images.map((img, idx) => (
                                <img key={idx} src={img} className="w-24 h-24 rounded object-cover" alt={`post-${idx}`} />
                              ))}
                              {post.images?.map((img, idx) => (
                                <img key={`legacy-${idx}`} src={img} className="w-24 h-24 rounded object-cover" alt={`post-${idx}`} />
                              ))}
                            </div>
                          )}
                          <span className="text-xs text-gray-500 mt-2 block">
                            {new Date(post.created_at).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">Chưa có bài viết</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes slideDown {
            0% { opacity: 0; transform: translateY(-20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-slide-down {
            animation: slideDown 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
}
