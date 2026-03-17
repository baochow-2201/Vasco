import React, { useState, useEffect } from "react";
import io from 'socket.io-client';
import api, { BASE } from './api';

export default function Profile() {
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [friendCount, setFriendCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editCover, setEditCover] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentInput, setCommentInput] = useState({});
  const [expandedComments, setExpandedComments] = useState({});

  // Fetch current user from localStorage and get their posts
  useEffect(() => {
    let socket = null;
    let isMounted = true; // Track if component is mounted
    
    const loadProfile = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        
        if (userData && token) {
          try {
            // Lấy thông tin profile từ database
            const profileData = await api.getUserProfile(userData.id);
            const mergedProfile = {
              ...userData,
              display_name: profileData.full_name?.trim() || userData.display_name || userData.username || '',
              bio: profileData.bio || '',
              avatar_url: profileData.avatar_url || userData.avatar_url || '',
              cover_url: profileData.cover_url || ''
            };
            setUserProfile(mergedProfile);
            setEditName(profileData.full_name?.trim() || userData.display_name || userData.username || '');
            setEditBio(profileData.bio || '');
            setEditAvatar(profileData.avatar_url || userData.avatar_url || '');
            setEditCover(profileData.cover_url || '');
          } catch (profileErr) {
            console.error('Error fetching profile from DB:', profileErr);
            // Fallback to localStorage
            setUserProfile(userData);
            setEditName(userData.display_name || userData.username || '');
            setEditBio(userData.bio || '');
            setEditAvatar(userData.avatar_url || '');
          }
        }
        
        // Fetch all posts and filter by user
        if (token) {
          try {
            const postsResponse = await api.fetchPosts();
            // Handle both direct array and wrapped response
            const postsArray = postsResponse.data?.posts || postsResponse.posts || postsResponse || [];
            if (Array.isArray(postsArray) && userData) {
              const userPostsData = postsArray.filter(p => p.user_id === userData.id);
              setUserPosts(userPostsData);
            }
          } catch (err) {
            console.error('Error fetching posts:', err);
          }

          // Fetch friends and update friend count
          try {
            const friendsData = await api.fetchFriends();
            const friendshipsArray = Array.isArray(friendsData) ? friendsData : (friendsData.friends || friendsData.data || []);
            setFriendCount(friendshipsArray.length);
          } catch (err) {
            console.error('Error fetching friends:', err);
          }
        }
        
        // Setup socket listener for new posts (only if component is still mounted)
        if (token && isMounted) {
          try {
            socket = io(BASE, {
              auth: { token },
              reconnection: true,
              reconnectionDelay: 1000,
              reconnectionAttempts: 5,
              reconnectionDelayMax: 5000,
            });
            
            socket.on('new_post', (payload) => {
              if (payload && payload.post) {
                const newPost = payload.post;
                const userData = JSON.parse(localStorage.getItem('user'));
                // Add to userPosts if it's the current user's post
                if (newPost.user_id === userData.id) {
                  setUserPosts(prev => [newPost, ...prev]);
                }
              }
            });
          } catch (err) {
            console.error('Socket setup error:', err);
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Lỗi tải thông tin profile');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
    
    // Cleanup socket on unmount
    return () => {
      isMounted = false;
      if (socket && socket.connected) {
        socket.disconnect();
      }
    };
  }, []);

  const handleSaveProfile = async () => {
    if (editName.trim() === '') {
      setError('Tên không được để trống');
      return;
    }
    
    try {
      let avatarUrl = editAvatar;
      let coverUrl = editCover;
      
      // If avatar is base64 (new upload), send to backend to upload to Cloudinary
      if (editAvatar && editAvatar.startsWith('data:')) {
        try {
          setError('Đang tải ảnh đại diện...');
          // Send base64 to backend for Cloudinary upload
          const uploadResponse = await api.uploadAvatar(editAvatar);
          console.log('Avatar upload response:', uploadResponse);
          
          if (uploadResponse && uploadResponse.url) {
            avatarUrl = uploadResponse.url;
            setError('');
          } else if (uploadResponse && uploadResponse.data && uploadResponse.data.url) {
            avatarUrl = uploadResponse.data.url;
            setError('');
          } else {
            console.error('No URL in avatar upload response:', uploadResponse);
            setError('Lỗi tải ảnh đại diện, vui lòng thử lại');
            return;
          }
        } catch (uploadErr) {
          console.error('Avatar upload error:', uploadErr);
          setError('Lỗi tải ảnh đại diện lên server: ' + (uploadErr.message || 'Không xác định'));
          return;
        }
      }
      
      // If cover is base64 (new upload), send to backend to upload to Cloudinary
      if (editCover && editCover.startsWith('data:')) {
        try {
          setError('Đang tải ảnh bìa...');
          // Send base64 to backend for Cloudinary upload
          const uploadResponse = await api.uploadCover(editCover);
          console.log('Cover upload response:', uploadResponse);
          
          if (uploadResponse && uploadResponse.url) {
            coverUrl = uploadResponse.url;
            setError('');
          } else if (uploadResponse && uploadResponse.data && uploadResponse.data.url) {
            coverUrl = uploadResponse.data.url;
            setError('');
          } else {
            console.error('No URL in cover upload response:', uploadResponse);
            setError('Lỗi tải ảnh bìa, vui lòng thử lại');
            return;
          }
        } catch (uploadErr) {
          console.error('Cover upload error:', uploadErr);
          setError('Lỗi tải ảnh bìa lên server: ' + (uploadErr.message || 'Không xác định'));
          return;
        }
      }
      
      const updated = { 
        full_name: editName, 
        bio: editBio,
        avatar_url: avatarUrl,
        cover_url: coverUrl
      };

      // Call API to save to database
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData && userData.id) {
        try {
          const response = await api.updateUserProfile(userData.id, updated);
          console.log('Update response:', response);
          
          if (response && (response.message === 'Updated' || response.message === 'Created')) {
            // Update state
            const mergedProfile = {
              ...userData,
              display_name: editName,
              bio: editBio,
              avatar_url: avatarUrl,
              cover_url: coverUrl
            };
            
            // Update localStorage
            localStorage.setItem('user', JSON.stringify(mergedProfile));
            setUserProfile(mergedProfile);
            setIsEditing(false);
            setError('');
            console.log('Profile saved successfully');
          } else {
            console.error('Unexpected response:', response);
            setError('Phản hồi không hợp lệ từ server');
          }
        } catch (apiErr) {
          console.error('API Error:', apiErr);
          console.error('Error details:', apiErr.message);
          setError(`Lỗi API: ${apiErr.message || 'Không xác định'}`);
        }
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Lỗi cập nhật profile');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show preview immediately using base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Upload to Cloudinary in background
      try {
        const formData = new FormData();
        formData.append('file', file);
        // Optional: append upload preset if needed for unsigned uploads
        // formData.append('upload_preset', 'your_preset');
        
        // For signed uploads, backend should handle this
        // For now, we'll use the file as base64 and backend can handle upload
        console.log('Avatar selected, will upload on profile save');
      } catch (err) {
        console.error('Error preparing avatar:', err);
      }
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show preview immediately using base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditCover(reader.result);
      };
      reader.readAsDataURL(file);
      console.log('Cover photo selected, will upload on profile save');
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentInput[postId]?.trim()) return;
    
    try {
      const response = await api.createComment(postId, commentInput[postId]);
      if (response) {
        setUserPosts(userPosts.map(p => 
          p.id === postId 
            ? { ...p, comments: [...(p.comments || []), response] }
            : p
        ));
        setCommentInput({ ...commentInput, [postId]: '' });
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg">Đang tải thông tin profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 pt-6 px-4 pb-12">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Cover Photo */}
          <div
            className="h-48 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 relative bg-cover bg-center"
            style={{
              backgroundImage: editCover 
                ? `url(${editCover})`
                : userProfile?.cover_url
                ? `url(${userProfile.cover_url})`
                : `linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)`
            }}
          >
            {isEditing && (
              <label className="absolute top-4 right-4 bg-white/90 hover:bg-white cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-md">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22a2 2 0 001.664.89H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Đổi ảnh bìa
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col gap-6 -mt-16 relative z-10 mb-6">
              {/* Avatar */}
              <div className="flex items-end gap-4">
                <div className="relative group flex-shrink-0">
                  <img
                    src={isEditing ? editAvatar : (userProfile?.avatar_url || "https://via.placeholder.com/150?text=Avatar")}
                    alt="avatar"
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-gray-200"
                  />
                  {isEditing && (
                    <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22a2 2 0 001.664.89H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 pb-2">
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Tên của bạn"
                        className="text-2xl font-bold bg-gray-100 text-black px-3 py-2 rounded-lg border-2 border-blue-300 focus:outline-none focus:border-blue-500"
                      />
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Thêm bio của bạn..."
                        className="text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-300 resize-none focus:outline-none focus:border-blue-400 text-sm"
                        rows="2"
                        maxLength="200"
                      />
                    </div>
                  ) : (
                    <div>
                      <h1 className="text-3xl font-bold text-black mb-1">
                        {userProfile?.display_name || userProfile?.username || 'User'}
                      </h1>
                      <p className="text-gray-600 text-sm">
                        {userProfile?.bio || 'Chưa có bio'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white px-4 py-2 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Lưu thay đổi
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(userProfile?.display_name || userProfile?.username || '');
                      setEditBio(userProfile?.bio || '');
                      setEditAvatar(userProfile?.avatar_url || '');
                      setError('');
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Hủy
                  </button>
                </div>
              )}

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Chỉnh sửa
                </button>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-3 gap-4 w-full">
          <div className="bg-white p-4 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
            <p className="text-2xl font-bold text-blue-600">{userPosts.length}</p>
            <p className="text-gray-600 text-sm">Bài đăng</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
            <p className="text-2xl font-bold text-purple-600">{friendCount}</p>
            <p className="text-gray-600 text-sm">Bạn bè</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
            <p className="text-2xl font-bold text-pink-600">0</p>
            <p className="text-gray-600 text-sm">Theo dõi</p>
          </div>
        </div>

        {/* --- Bài đăng của user --- */}
        <div className="w-full">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" />
            </svg>
            <h2 className="text-xl font-bold text-gray-800">Bài đăng của tôi</h2>
          </div>
          
          {userPosts.length === 0 ? (
            <div className="bg-white w-full p-12 rounded-2xl shadow-lg text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-lg">Chưa có bài đăng nào</p>
            </div>
          ) : (
            userPosts.map((post) => {
              const postMediaArray = post.post_media || post.postMedia || [];
              const images = postMediaArray
                .map(pm => pm.media?.url || pm.media?.public_id)
                .filter(Boolean);

              return (
                <div key={post.id} className="bg-white w-full p-5 rounded-2xl shadow-md hover:shadow-lg transition-shadow mb-4">
                  {/* Post Header */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                    <img
                      src={post.User?.user_profile?.avatar_url || post.User?.avatar_url || post.user?.user_profile?.avatar_url || post.user?.avatar_url || userProfile?.avatar_url || "https://via.placeholder.com/50?text=Avatar"}
                      alt="avatar"
                      className="w-12 h-12 rounded-full object-cover bg-gray-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-black text-sm">
                        {(post.User?.user_profile?.full_name?.trim() || post.User?.full_name?.trim() || post.User?.display_name || post.User?.username || 
                          post.user?.user_profile?.full_name?.trim() || post.user?.full_name?.trim() || post.user?.display_name || post.user?.username || 
                          userProfile?.display_name || 'User')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(post.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

                  {/* Post Images */}
                  {images.length > 0 && (
                    <div className={`grid gap-2 mb-4 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-200">
                          <img
                            src={img}
                            alt="post"
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/400?text=Image+Error";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comments Section */}
                  <div className="border-t border-gray-200 pt-3 space-y-3">
                    <div className="text-sm text-gray-500">
                      <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a1 1 0 001 1h12a1 1 0 001-1V6a2 2 0 00-2-2H4z" clipRule="evenodd" />
                      </svg>
                      {post.comments?.length || 0} bình luận
                    </div>

                    {/* Comments List */}
                    {expandedComments[post.id] && post.comments?.length > 0 && (
                      <div className="mb-3 bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto space-y-2">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="text-sm">
                            <span className="font-semibold text-blue-600">
                              {comment.User?.user_profile?.full_name || comment.User?.display_name || comment.User?.username || comment.user?.display_name || comment.user?.username || 'User'}
                            </span>
                            <p className="text-gray-700 text-xs mt-1">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Toggle Comments */}
                    {post.comments?.length > 0 && (
                      <button
                        onClick={() => setExpandedComments({
                          ...expandedComments,
                          [post.id]: !expandedComments[post.id]
                        })}
                        className="text-blue-500 text-sm hover:text-blue-700 font-medium transition-colors"
                      >
                        {expandedComments[post.id] ? '▼ Ẩn bình luận' : '▶ Xem bình luận'}
                      </button>
                    )}

                    {/* Add Comment */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <input
                        type="text"
                        value={commentInput[post.id] || ''}
                        onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        placeholder="Viết bình luận..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-black placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-all font-semibold flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.429 5.951 1.429a1 1 0 001.169-1.409l-7-14z" />
                        </svg>
                        Gửi
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
