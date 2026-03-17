import React, { useState, useEffect } from "react";
import api from './api';

const FriendList = ({ goBack }) => {
  const [friends, setFriends] = useState([]);
  const [users, setUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [sendingRequests, setSendingRequests] = useState(new Set());
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'suggestions', 'requests'

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  // Lấy token từ localStorage
  const getToken = () => localStorage.getItem('token');

  // Fetch danh sách bạn bè
  const fetchFriends = async () => {
    try {
      const data = await api.fetchFriends();
      // Handle both array and wrapped response
      const friendshipsArray = Array.isArray(data) ? data : (data.friends || data.data || []);
      
      // Get current user ID from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = currentUser.id;
      
      // Transform friendships to friends by extracting the other user
      const friendsList = friendshipsArray.map(friendship => {
        const friend = friendship.user1_id === currentUserId ? friendship.user2 : friendship.user1;
        return {
          ...friend,
          friend_since: friendship.createdAt, // Include friendship creation date
        };
      }).filter(Boolean);
      
      setFriends(friendsList);
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách bạn bè');
      console.error('Error fetching friends:', err);
    }
  };

  // Fetch danh sách người dùng để gợi ý kết bạn
  const fetchUsers = async () => {
    try {
      const data = await api.fetchUsers();
      // Handle both array and wrapped response
      const usersArray = Array.isArray(data) ? data : (data.users || data.data || []);
      
      // Filter out current user, already-friends, and users with pending requests
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const friendIds = friends.map(f => f.id);
      const sentRequestIds = friendRequests.map(r => r.requester_id); // Users who sent us requests
      const filteredUsers = usersArray.filter(u => 
        u.id !== currentUser.id && 
        !friendIds.includes(u.id) &&
        !sentRequestIds.includes(u.id) // Don't show people who already sent us requests
      );
      
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Fetch danh sách lời mời kết bạn
  const fetchFriendRequests = async () => {
    try {
      const data = await api.getFriendRequests();
      // Handle both array and wrapped response
      const requestsArray = Array.isArray(data) ? data : (data.requests || data.data || []);
      setFriendRequests(requestsArray);
    } catch (err) {
      console.error('Error fetching friend requests:', err);
    }
  };

  // Chấp nhận lời mời kết bạn
  const acceptRequest = async (requestId) => {
    try {
      await api.acceptFriendRequest(requestId);
      showToast('Đã chấp nhận lời mời');
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      fetchFriends();
    } catch (err) {
      console.error('Error accepting request:', err);
      showToast('Không thể chấp nhận lời mời');
    }
  };

  // Từ chối lời mời kết bạn
  const rejectRequest = async (requestId) => {
    try {
      await api.rejectFriendRequest(requestId);
      showToast('Đã từ chối lời mời');
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Error rejecting request:', err);
      showToast('Không thể từ chối lời mời');
    }
  };

  // Gửi lời mời kết bạn
  const sendFriendRequest = async (receiverId) => {
    if (sendingRequests.has(receiverId)) return;

    setSendingRequests(prev => new Set(prev).add(receiverId));

    try {
      const token = getToken();
      if (!token) {
        showToast('Bạn cần đăng nhập');
        return;
      }

      // Check if receiver already sent us a friend request
      const hasIncomingRequest = friendRequests.some(r => r.requester_id === receiverId);
      if (hasIncomingRequest) {
        showToast('Người dùng này đã gửi lời mời cho bạn rồi');
        setSendingRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(receiverId);
          return newSet;
        });
        return;
      }

      console.log('Sending friend request to:', receiverId);

      const response = await api.sendFriendRequest(receiverId, 'Xin chào, làm bạn với tôi nhé!');
      const data = response;
      console.log('Friend request response:', data);

      if (data && !data.error) {
        showToast('Đã gửi lời mời kết bạn');
        // Cập nhật trạng thái người dùng (đã gửi lời mời)
        setUsers(prev => prev.map(user =>
          user.id === receiverId ? { ...user, requestSent: true, friendRequestId: data.request?.id || null } : user
        ));
      } else if (data && data.message === 'Đã gửi lời mời, đang chờ phản hồi') {
        showToast('Đã gửi lời mời, đang chờ phản hồi');
        // Cập nhật trạng thái người dùng (đã gửi lời mời)
        setUsers(prev => prev.map(user =>
          user.id === receiverId ? { ...user, requestSent: true } : user
        ));
      } else {
        showToast(data.message || 'Không thể gửi lời mời');
      }
    } catch (err) {
      showToast('Lỗi khi gửi lời mời');
      console.error('Error sending friend request:', err);
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(receiverId);
        return newSet;
      });
    }
  };

  // Xóa bạn bè
  const removeFriend = async (friendId) => {
    try {
      const data = await api.removeFriend(friendId);
      setFriends(prev => prev.filter(f => f.id !== friendId));
      showToast('Đã xóa bạn bè');
    } catch (err) {
      console.error('Error removing friend:', err);
      showToast('Không thể xóa bạn bè');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [friendRequests]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFriends(), fetchFriendRequests()]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button
          onClick={goBack}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Bạn bè</h1>
        <button
          onClick={goBack}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
        >
          Quay lại
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-300">
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-4 py-2 font-semibold ${activeTab === 'friends' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
        >
          Bạn bè ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 font-semibold ${activeTab === 'requests' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
        >
          Lời mời ({friendRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`px-4 py-2 font-semibold ${activeTab === 'suggestions' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
        >
          Gợi ý ({users.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'friends' && (
        <div className="flex flex-col gap-4">
          {friends.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              Bạn chưa có bạn bè nào. Hãy gửi lời mời kết bạn!
            </div>
          ) : (
            friends.filter(Boolean).map((friend) => (
              <div
                key={`friend-${friend.id}`}
                className="flex items-center gap-4 bg-[#A2D3FF] p-4 rounded-lg shadow-sm"
              >
                <img
                  src={friend?.user_profile?.avatar_url || friend?.avatar_url || "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/kw5jvhez_expires_30_days.png"}
                  className="w-[90px] h-20 object-cover rounded-full"
                  alt="avatar"
                />
                <div className="flex-1">
                  <span className="text-black text-xl font-semibold">{friend?.user_profile?.full_name || friend?.display_name || friend?.full_name || friend?.username || 'Người dùng'}</span>
                  <div className="text-gray-600 text-sm">@{friend?.username || ''}</div>
                  <div className="text-gray-500 text-xs">
                    Bạn bè từ {friend?.friend_since ? new Date(friend.friend_since).toLocaleDateString('vi-VN') : ''}
                  </div>
                </div>
                <button
                  onClick={() => removeFriend(friend.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                >
                  Xóa bạn
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="flex flex-col gap-4">
          {friendRequests.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              Không có lời mời kết bạn nào
            </div>
          ) : (
            friendRequests.filter(Boolean).map((request) => (
              <div
                key={`request-${request.id}`}
                className="flex items-center gap-4 bg-[#FFE4B5] p-4 rounded-lg shadow-sm"
              >
                <img
                  src={request?.requester?.user_profile?.avatar_url || request?.requester?.avatar_url || request?.sender?.avatar_url || "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/kw5jvhez_expires_30_days.png"}
                  className="w-[90px] h-20 object-cover rounded-full"
                  alt="avatar"
                />
                <div className="flex-1">
                  <span className="text-black text-xl font-semibold">{request?.requester?.user_profile?.full_name || request?.requester?.display_name || request?.requester?.full_name || request?.requester?.username || request?.sender?.display_name || 'Người dùng'}</span>
                  <div className="text-gray-600 text-sm">@{request?.requester?.username || request?.sender?.username || ''}</div>
                  {request?.message && <div className="text-gray-700 text-sm mt-1">"{request.message}"</div>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptRequest(request.id)}
                    className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600"
                  >
                    Chấp nhận
                  </button>
                  <button
                    onClick={() => rejectRequest(request.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.filter(Boolean).length === 0 ? (
            <div className="col-span-full text-gray-500 text-center py-8">
              Không có gợi ý kết bạn
            </div>
          ) : (
            users.filter(Boolean).map((user) => (
              <div
                key={`user-${user.id}`}
                className="flex flex-col items-center gap-3 bg-[#F0F8FF] p-4 rounded-lg shadow-sm"
              >
                <img
                  src={user?.user_profile?.avatar_url || user?.avatar_url || "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/kw5jvhez_expires_30_days.png"}
                  className="w-[80px] h-[80px] object-cover rounded-full"
                  alt="avatar"
                />
                <div className="text-center flex-1">
                  <span className="text-black text-lg font-semibold block">{user?.user_profile?.full_name || user?.display_name || user?.full_name || user?.username || 'Người dùng'}</span>
                  <div className="text-gray-600 text-sm">@{user?.username || ''}</div>
                </div>
                <button
                  onClick={() => sendFriendRequest(user.id)}
                  disabled={user.requestSent || user.isFriend || sendingRequests.has(user.id)}
                  className={`w-full px-3 py-1 rounded-lg text-white font-semibold ${
                    user.requestSent || user.isFriend || sendingRequests.has(user.id)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#88BCF8] hover:bg-[#63A4F8]'
                  }`}
                >
                  {sendingRequests.has(user.id) ? 'Đang gửi...' : user.isFriend ? 'Bạn bè' : user.requestSent ? 'Đã gửi' : 'Thêm bạn'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FriendList;
