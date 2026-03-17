import React, { useState, useEffect } from "react";
import api from './api';

export default function NewFeed() {
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);

  const [commentsMap, setCommentsMap] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [posts, setPosts] = useState([]);
  // const [currentUserId, setCurrentUserId] = useState(null); // no longer required

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    // Fetch fresh user profile on mount to ensure we have latest data
    (async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          // Fetch fresh profile
          const profileData = await api.getUserProfile(parsedUser.id);
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
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        try { const savedUser = localStorage.getItem('user'); if (savedUser) setUser(JSON.parse(savedUser)); } catch(e){}
      }
    })();

    api.fetchPosts().then(async (data) => {
      const postsData = data.data?.posts || data.posts || [];
      console.log('NewFeed posts data:', postsData);
      if (postsData.length > 0) {
        console.log('First post user data:', postsData[0].user);
        console.log('First post user.user_profile:', postsData[0].user?.user_profile);
      }
      setPosts(postsData);
      // fetch comments for each post and initialize maps
      postsData.forEach(async (p) => {
        try {
          const res = await api.fetchComments(p.id);
          setCommentsMap(prev => ({ ...prev, [p.id]: res.comments || [] }));
        } catch (err) { console.error('Error fetching comments for post', p.id, err); }
      });
    }).catch(console.error);
  }, []);

  // user is set at the top-level useEffect

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Nội dung chính */}
      <div className="flex-1 ml-[72px] flex flex-col">
        {/* --- Header đã bị loại bỏ --- */}

        {/* Feed hiển thị bài đăng */}
        <div className="flex flex-col items-center gap-4 mt-[20px] w-full">
          {/* Toast */}
          {toast && (
            <div className="fixed top-[40px] right-10 bg-black text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-down">
              {toast}
            </div>
          )}

          {/* Danh sách bài post */}
          {posts.length === 0 && (
            <div className="text-gray-500">Chưa có bài viết</div>
          )}
          {posts.map((p, i) => (
              <div key={p.id || i} className="flex flex-col bg-[#A2D3FF] w-full max-w-[1000px] p-4 rounded-[5px] gap-6">
              {/* Header bài post */}
              <div className="flex items-center gap-4">
                <img
                  src={p.user?.user_profile?.avatar_url || p.user?.avatar_url || "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/t3jnx5iy_expires_30_days.png"}
                  alt="avatar"
                  className="w-[58px] h-[51px] rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-black text-xl">{(p.user?.user_profile?.full_name?.trim() || p.user?.full_name?.trim() || p.user?.display_name || p.user?.username || p?.author || p?.display_name || 'Người dùng')}</span>
                  <span className="text-gray-700 text-sm">@{p.user?.username || 'user'}</span>
                  <span className="text-black text-base">{new Date(p.created_at).toLocaleString('vi-VN')}</span>
                </div>
              </div>

              {/* Nội dung bài đăng */}
              {p.text && <p className="text-black text-lg">{p.text}</p>}

              {/* Ảnh bài đăng */}
              {(() => {
                const postMediaArray = p.post_media || p.postMedia || [];
                const images = postMediaArray.map(pm => pm.media?.url || pm.media?.public_id).filter(Boolean);
                return images && images.length > 0 ? (
                  <div className="flex gap-4">
                    {images.map((img, idx) => (
                      <img key={idx} src={img} alt="post" className="rounded-lg w-full max-h-96 object-cover" />
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Khu vực bình luận */}
              <div className="flex items-center gap-2 mt-2">
                <img
                  src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/v4rj7jgu_expires_30_days.png"
                  alt="like"
                  className="w-[39px] h-[45px] cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => {
                    api.likePost(p.id).then(() => showToast('Bạn đã thả tim')).catch(console.error);
                  }}
                />
                <input
                  placeholder="Bình luận..."
                  value={commentInputs[p.id] || ''}
                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                  className="flex-1 py-2 px-4 rounded-lg text-black border-0"
                />
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded-lg"
                  onClick={() => {
                    const content = (commentInputs[p.id] || '').trim();
                    if (!content) return;
                    const tempId = `tmp-${Date.now()}`;
                    const tempComment = { id: tempId, content, User: user || null, created_at: new Date().toISOString(), post_id: p.id };
                    setCommentsMap(prev => ({ ...prev, [p.id]: [...(prev[p.id] || []), tempComment] }));
                    setCommentInputs(prev => ({ ...prev, [p.id]: '' }));
                    api.createComment({ post_id: p.id, content })
                      .then((resp) => {
                        if (resp.comment) {
                          setCommentsMap(prev => ({ ...prev, [p.id]: (prev[p.id] || []).map(c => c.id === tempId ? resp.comment : c) }));
                          showToast('Đã gửi bình luận');
                        }
                      })
                      .catch((err) => {
                        setCommentsMap(prev => ({ ...prev, [p.id]: (prev[p.id] || []).filter(c => c.id !== tempId) }));
                        console.error(err);
                      });
                  }}
                >
                  Gửi
                </button>
              </div>

              {/* Danh sách bình luận */}
              {commentsMap[p.id]?.length > 0 && (
                <div className="mt-2 ml-12 flex flex-col gap-1">
                  {commentsMap[p.id].map((cmt, idx) => {
                    return (
                      <div key={cmt.id || idx} className="text-black text-sm bg-white px-2 py-1 rounded-lg">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-semibold text-xs mr-2">{(cmt.User && (cmt.User.full_name || cmt.User.username)) || cmt.author || 'Người dùng'}</span>
                          <span className="text-[10px]">{cmt.created_at ? new Date(cmt.created_at).toLocaleString() : ''}</span>
                        </div>
                        <div className="mt-1">{cmt.content || cmt}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

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
