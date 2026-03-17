export const BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const getToken = () => localStorage.getItem('token');

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};
const authHeadersForm = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Auth
  login: async (usernameOrEmail, password) => {
    console.log('📤 Sending login request to:', `${BASE}/api/auth/login`);
    const res = await fetch(`${BASE}/api/auth/login`, { 
      method: 'POST', 
      headers: authHeaders(), 
      body: JSON.stringify({ usernameOrEmail, password }) 
    });
    console.log('📥 Login response status:', res.status);
    const json = await res.json();
    console.log('📥 Login response body:', json);
    return json;
  },
  register: async (payload) => {
    // Backend expects: username, email, password
    // Frontend sends: username/display_name, email, password, full_name, display_name, mssv
    const body = {
      username: payload.username || payload.display_name,
      email: payload.email,
      password: payload.password,
      full_name: payload.full_name || payload.name,
      display_name: payload.display_name,
    };
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  },
  changePassword: async (oldPassword, newPassword) => {
    const res = await fetch(`${BASE}/api/auth/change-password`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    });
    return res.json();
  },

  // Posts
  fetchPosts: async () => {
    const res = await fetch(`${BASE}/api/posts`, { headers: authHeaders() });
    return res.json();
  },
  fetchPost: async (id) => {
    const res = await fetch(`${BASE}/api/posts/${id}`, { headers: authHeaders() });
    return res.json();
  },
  createPost: async (payload) => {
    // If images are File objects, use multipart/form-data
    if (payload && payload.media && payload.media.length > 0 && (typeof File !== 'undefined' ? payload.media[0] instanceof File : true)) {
      const form = new FormData();
      form.append('text', payload.text || '');
      for (const f of payload.media) form.append('media', f);
      const res = await fetch(`${BASE}/api/posts`, { method: 'POST', headers: authHeadersForm(), body: form });
      return res.json();
    }
    const res = await fetch(`${BASE}/api/posts`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
    return res.json();
  },
  updatePost: async (id, payload) => {
    const res = await fetch(`${BASE}/api/posts/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) });
    return res.json();
  },
  deletePost: async (id) => {
    const res = await fetch(`${BASE}/api/posts/${id}`, { method: 'DELETE', headers: authHeaders() });
    return res.json();
  },
  likePost: async (id) => {
    const res = await fetch(`${BASE}/api/posts/${id}/like`, { method: 'POST', headers: authHeaders() });
    return res.json();
  },

  // Comments
  fetchComments: async (postId) => {
    const url = postId ? `${BASE}/api/comments?post_id=${postId}` : `${BASE}/api/comments`;
    const res = await fetch(url, { headers: authHeaders() });
    return res.json();
  },
  createComment: async (payload) => {
    const res = await fetch(`${BASE}/api/comments`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
    return res.json();
  },
  updateComment: async (id, content) => {
    const res = await fetch(`${BASE}/api/comments/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ content }) });
    return res.json();
  },
  deleteComment: async (id) => {
    const res = await fetch(`${BASE}/api/comments/${id}`, { method: 'DELETE', headers: authHeaders() });
    return res.json();
  },

  // Messages
  fetchMessages: async (conversationId) => {
    const url = conversationId ? `${BASE}/api/messages?conversation_id=${conversationId}` : `${BASE}/api/messages`;
    const res = await fetch(url, { headers: authHeaders() });
    return res.json();
  },
  fetchPublicMessages: async () => {
    const res = await fetch(`${BASE}/api/messages/public/chat`, { headers: authHeaders() });
    return res.json();
  },
  sendPublicMessage: async (text, media_url = null) => {
    const res = await fetch(`${BASE}/api/messages/public/send`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ text, media_url }) });
    return res.json();
  },
  fetchPrivateMessages: async (friendId) => {
    const res = await fetch(`${BASE}/api/private-messages/${friendId}`, { headers: authHeaders() });
    return res.json();
  },
  sendPrivateMessage: async (receiver_id, text, media_url, message_type) => {
    const res = await fetch(`${BASE}/api/private-messages`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ receiver_id, text, media_url, message_type }) });
    return res.json();
  },
  deleteMessage: async (id, isPrivate = false) => {
    const url = isPrivate ? `${BASE}/api/private-messages/${id}` : `${BASE}/api/messages/${id}`;
    const res = await fetch(url, { method: 'DELETE', headers: authHeaders() });
    return res.json();
  },

  // Convos
  fetchConversations: async () => {
    const res = await fetch(`${BASE}/api/conversations`, { headers: authHeaders() });
    return res.json();
  },

  // User profile
  fetchProfile: async () => {
    const res = await fetch(`${BASE}/api/users/profile`, { headers: authHeaders() });
    return res.json();
  },
  updateProfile: async (payload) => {
    const res = await fetch(`${BASE}/api/users/profile`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) });
    return res.json();
  },
  updateActivity: async () => {
    const res = await fetch(`${BASE}/api/users/activity/update`, { method: 'PUT', headers: authHeaders() });
    return res.json();
  },
  createConversation: async (participants, group_name) => {
    const res = await fetch(`${BASE}/api/conversations`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ participants, group_name }) });
    return res.json();
  },
  addParticipant: async (conversationId, user_id) => {
    const res = await fetch(`${BASE}/api/conversations/${conversationId}/participants`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ user_id }) });
    return res.json();
  },
  removeParticipant: async (conversationId, user_id) => {
    const res = await fetch(`${BASE}/api/conversations/${conversationId}/participants/${user_id}`, { method: 'DELETE', headers: authHeaders() });
    return res.json();
  },

  // Friends
  fetchFriends: async () => {
    const res = await fetch(`${BASE}/api/friendships`, { headers: authHeaders() });
    return res.json();
  },
  fetchUsers: async () => {
    const res = await fetch(`${BASE}/api/users/list/all`, { headers: authHeaders() });
    return res.json();
  },
  sendFriendRequest: async (receiver_id, message) => {
    const res = await fetch(`${BASE}/api/friend-requests`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ receiver_id, message }) });
    return res.json();
  },
  getFriendRequests: async () => {
    const res = await fetch(`${BASE}/api/friend-requests`, { headers: authHeaders() });
    return res.json();
  },
  acceptFriendRequest: async (id) => {
    const res = await fetch(`${BASE}/api/friend-requests/${id}/accept`, { method: 'PUT', headers: authHeaders() });
    return res.json();
  },
  rejectFriendRequest: async (id) => {
    const res = await fetch(`${BASE}/api/friend-requests/${id}/reject`, { method: 'PUT', headers: authHeaders() });
    return res.json();
  },
  removeFriend: async (friendId) => {
    const res = await fetch(`${BASE}/api/friends/${friendId}`, { method: 'DELETE', headers: authHeaders() });
    return res.json();
  },

  // User Profiles
  getUserProfile: async (userId) => {
    const res = await fetch(`${BASE}/api/user-profiles/user/${userId}`, { headers: authHeaders() });
    return res.json();
  },
  getUserPosts: async (userId) => {
    const res = await fetch(`${BASE}/api/posts?user_id=${userId}`, { headers: authHeaders() });
    return res.json();
  },
  updateUserProfile: async (userId, payload) => {
    const res = await fetch(`${BASE}/api/user-profiles/user/${userId}`, { 
      method: 'PUT', 
      headers: authHeaders(), 
      body: JSON.stringify(payload) 
    });
    return res.json();
  },
  uploadAvatar: async (base64Data) => {
    // Send base64 image to backend for Cloudinary upload
    const res = await fetch(`${BASE}/api/upload/avatar`, { 
      method: 'POST', 
      headers: authHeaders(), 
      body: JSON.stringify({ image: base64Data }) 
    });
    return res.json();
  },
  uploadCover: async (base64Data) => {
    // Send base64 image to backend for Cloudinary upload
    const res = await fetch(`${BASE}/api/upload/cover`, { 
      method: 'POST', 
      headers: authHeaders(), 
      body: JSON.stringify({ image: base64Data }) 
    });
    return res.json();
  },
  uploadMessageImage: async (base64Data) => {
    // Send base64 image to backend for Cloudinary upload
    const res = await fetch(`${BASE}/api/upload/message`, { 
      method: 'POST', 
      headers: authHeaders(), 
      body: JSON.stringify({ image: base64Data }) 
    });
    return res.json();
  },

  // Notifications
  fetchNotifications: async () => {
    const res = await fetch(`${BASE}/api/notifications`, { headers: authHeaders() });
    return res.json();
  },
  markNotificationRead: async (id) => {
    const res = await fetch(`${BASE}/api/notifications/${id}/read`, { method: 'PUT', headers: authHeaders() });
    return res.json();
  },

  // Reports
  createReport: async (payload) => {
    const res = await fetch(`${BASE}/api/reports`, { 
      method: 'POST', 
      headers: authHeaders(), 
      body: JSON.stringify(payload) 
    });
    return res.json();
  },

  // Generic post method
  post: async (endpoint, payload) => {
    const res = await fetch(`${BASE}${endpoint}`, { 
      method: 'POST', 
      headers: authHeaders(), 
      body: JSON.stringify(payload) 
    });
    return res.json();
  },

  // Reactions
  fetchReactions: async (postId) => {
    const res = await fetch(`${BASE}/api/reactions?post_id=${postId}`, { headers: authHeaders() });
    return res.json();
  },

  // Upload avatar and cover
  uploadAvatar: async (base64Data) => {
    const res = await fetch(`${BASE}/api/upload/avatar`, { 
      method: 'POST', 
      headers: authHeaders(), 
      body: JSON.stringify({ image: base64Data }) 
    });
    return res.json();
  },
  uploadCover: async (base64Data) => {
    const res = await fetch(`${BASE}/api/upload/cover`, { 
      method: 'POST', 
      headers: authHeaders(), 
      body: JSON.stringify({ image: base64Data }) 
    });
    return res.json();
  },
};

export default api;
