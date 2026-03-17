/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { BASE } from "./api";

export default function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [comments, setComments] = useState([]);
  const [modal, setModal] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [filterReportType, setFilterReportType] = useState("all");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalReports: 0,
    totalComments: 0,
    bannedUsers: 0,
    resolvedReports: 0
  });

  const token = localStorage.getItem("token");

  // ---------- MODAL ----------
  const showModal = (msg, onYes) => setModal({ msg, onYes });
  const closeModal = () => setModal(null);

  // ---------- FETCH ----------
  const fetchAdminUsers = async () => {
    try {
      const res = await fetch(`${BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const usersList = Array.isArray(data) ? data : data.data || [];
      setUsers(usersList);
      return usersList.length;
    } catch (err) {
      console.error(err);
      setUsers([]);
      return 0;
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${BASE}/api/posts`);
      const data = await res.json();
      const postsList = data.data?.posts || data.posts || data || [];
      const postsArray = Array.isArray(postsList) ? postsList : [];
      setPosts(postsArray);
      return postsArray.length;
    } catch (err) {
      console.error(err);
      setPosts([]);
      return 0;
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${BASE}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const reportsList = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
      setReports(reportsList);
      console.log('📊 Fetched reports:', reportsList);
      return reportsList.length;
    } catch (err) {
      console.error('Error fetching reports:', err);
      setReports([]);
      return 0;
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`${BASE}/api/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const commentsList = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      setComments(commentsList);
      return commentsList.length;
    } catch (err) {
      console.error(err);
      setComments([]);
      return 0;
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchAdminUsers(),
      fetchPosts(),
      fetchReports(),
      fetchComments()
    ]);
    
    setStats(prev => ({
      ...prev,
      totalUsers: users.length,
      totalPosts: posts.length,
      totalReports: reports.length,
      totalComments: comments.length,
      bannedUsers: users.filter(u => u.status === 'banned' || u.is_banned).length,
      resolvedReports: reports.filter(r => r.status === 'resolved' || r.resolved).length,
    }));
    
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // ---------- ACTIONS ----------
  const banUser = (id) =>
    showModal("Ban user này?", async () => {
      try {
        await fetch(`${BASE}/api/admin/user/${id}/ban`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
        closeModal();
        await fetchAdminUsers();
      } catch (err) {
        console.error('Ban user error:', err);
      }
    });

  const unbanUser = (id) =>
    showModal("Bỏ ban user này?", async () => {
      try {
        await fetch(`${BASE}/api/admin/user/${id}/unban`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
        closeModal();
        await fetchAdminUsers();
      } catch (err) {
        console.error('Unban user error:', err);
      }
    });

  const deletePost = (id) =>
    showModal("Xóa bài viết này?", async () => {
      try {
        await fetch(`${BASE}/api/admin/post/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        closeModal();
        await fetchPosts();
      } catch (err) {
        console.error('Delete post error:', err);
      }
    });

  const deleteComment = (id) =>
    showModal("Xóa bình luận này?", async () => {
      try {
        await fetch(`${BASE}/api/admin/comment/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        closeModal();
        await fetchComments();
      } catch (err) {
        console.error('Delete comment error:', err);
      }
    });

  const editPost = (id, content) => {
    setEditingId(id);
    setEditingContent(content);
  };

  const editComment = (id, content) => {
    setEditingId(id);
    setEditingContent(content);
  };

  const saveEdit = async (type, id) => {
    if (!editingContent.trim()) {
      closeModal();
      return;
    }
    
    const endpoints = {
      post: `${BASE}/api/admin/post/${id}`,
      comment: `${BASE}/api/admin/comment/${id}`,
      message: `${BASE}/api/admin/message/${id}`
    };

    try {
      await fetch(endpoints[type], {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          content: editingContent,
          text: editingContent 
        })
      });
      
      setEditingId(null);
      setEditingContent("");
      
      if (type === "post") await fetchPosts();
      if (type === "comment") await fetchComments();
    } catch (err) {
      console.error(`Edit ${type} error:`, err);
    }
  };

  const resolveReport = (id) =>
    showModal("Đánh dấu đã xử lý?", async () => {
      try {
        await fetch(`${BASE}/api/admin/report/${id}/resolve`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
        closeModal();
        await fetchReports();
      } catch (err) {
        console.error('Resolve report error:', err);
      }
    });

  const dismissReport = (id) =>
    showModal("Bỏ qua báo cáo này?", async () => {
      try {
        await fetch(`${BASE}/api/admin/report/${id}/dismiss`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
        closeModal();
        await fetchReports();
      } catch (err) {
        console.error('Dismiss report error:', err);
      }
    });

  const rejectPost = (id) =>
    showModal("Từ chối/ẩn bài viết này?", async () => {
      try {
        await fetch(`${BASE}/api/admin/post/${id}/reject`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
        closeModal();
        await fetchPosts();
        await fetchReports();
      } catch (err) {
        console.error('Reject post error:', err);
      }
    });

  const rejectComment = (id) =>
    showModal("Từ chối/ẩn bình luận này?", async () => {
      try {
        await fetch(`${BASE}/api/admin/comment/${id}/reject`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
        closeModal();
        await fetchComments();
        await fetchReports();
      } catch (err) {
        console.error('Reject comment error:', err);
      }
    });

  // Stat Card Component
  const StatCard = ({ title, count, icon, color }) => (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-2xl hover:shadow-xl transition-all hover:scale-105 border border-white/10`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm opacity-90 font-medium uppercase tracking-wide">{title}</p>
          <p className="text-5xl font-bold mt-3">{count}</p>
        </div>
        <div className="text-5xl opacity-30">{icon}</div>
      </div>
      <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
        <div className="h-full w-3/4 bg-white/40 rounded-full"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white flex items-center gap-3 mb-2">
            <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 17v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd" />
            </svg>
            Admin Dashboard
          </h1>
          <p className="text-gray-400">Quản lý toàn bộ hệ thống</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl p-1">
          {[
            { id: 'dashboard', label: 'Thống kê', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'users', label: 'Người dùng', icon: 'M12 4.354a4 4 0 110 8.308 4 4 0 010-8.308M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'posts', label: 'Bài viết', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { id: 'comments', label: 'Bình luận', icon: 'M7 8a4 4 0 100-8 4 4 0 000 8zM7 12c-2.21 0-4 1.34-4 3v2h8v-2c0-1.66-1.79-3-4-3zm6-3.5a4 4 0 11-8 0 4 4 0 018 0zM17 12c-2.21 0-4 1.34-4 3v2h8v-2c0-1.66-1.79-3-4-3z' },
            { id: 'reports', label: 'Báo cáo', icon: 'M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', badge: reports.filter(r => r.status !== 'resolved' && !r.resolved).length },
            { id: 'media', label: 'Media', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all whitespace-nowrap relative ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg scale-105'
                  : 'bg-slate-600 text-gray-300 hover:bg-slate-500'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        <button
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-4 py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mb-6"
          onClick={refreshAll}
          disabled={loading}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Đang tải...' : 'Làm mới dữ liệu'}
        </button>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Tổng người dùng" count={stats.totalUsers} icon="👥" color="from-blue-500 via-blue-600 to-blue-700" />
              <StatCard title="Tổng bài viết" count={stats.totalPosts} icon="📄" color="from-green-500 via-green-600 to-green-700" />
              <StatCard title="Tổng bình luận" count={stats.totalComments} icon="💬" color="from-purple-500 via-purple-600 to-purple-700" />
              <StatCard title="Báo cáo (chưa xử lý)" count={stats.totalReports - stats.resolvedReports} icon="⚠️" color="from-orange-500 via-orange-600 to-orange-700" />
              <StatCard title="Người dùng bị ban" count={stats.bannedUsers} icon="🚫" color="from-red-500 via-red-600 to-red-700" />
              <StatCard title="Báo cáo (đã xử lý)" count={stats.resolvedReports} icon="✅" color="from-emerald-500 via-emerald-600 to-emerald-700" />
            </div>
            
            <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-2xl p-8 text-center border border-slate-600/50 shadow-2xl">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Tóm tắt hệ thống</h3>
              <p className="text-gray-400 mb-6">Tổng cộng: <span className="text-cyan-400 font-bold">{stats.totalUsers + stats.totalPosts + stats.totalComments + stats.totalReports}</span> mục dữ liệu</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-lg p-4 border border-red-500/30 hover:border-red-500/60 transition-all">
                  <p className="text-gray-300 text-xs uppercase tracking-wide font-semibold">Tỷ lệ ban</p>
                  <p className="text-3xl font-bold text-red-400 mt-2">{stats.totalUsers > 0 ? ((stats.bannedUsers / stats.totalUsers) * 100).toFixed(1) : 0}%</p>
                </div>
                <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-lg p-4 border border-green-500/30 hover:border-green-500/60 transition-all">
                  <p className="text-gray-300 text-xs uppercase tracking-wide font-semibold">Xử lý báo cáo</p>
                  <p className="text-3xl font-bold text-green-400 mt-2">{stats.totalReports > 0 ? ((stats.resolvedReports / stats.totalReports) * 100).toFixed(1) : 0}%</p>
                </div>
                <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-lg p-4 border border-blue-500/30 hover:border-blue-500/60 transition-all">
                  <p className="text-gray-300 text-xs uppercase tracking-wide font-semibold">Bài/Người</p>
                  <p className="text-3xl font-bold text-blue-400 mt-2">{stats.totalUsers > 0 ? (stats.totalPosts / stats.totalUsers).toFixed(2) : 0}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-lg p-4 border border-purple-500/30 hover:border-purple-500/60 transition-all">
                  <p className="text-gray-300 text-xs uppercase tracking-wide font-semibold">Bình/Bài</p>
                  <p className="text-3xl font-bold text-purple-400 mt-2">{stats.totalPosts > 0 ? (stats.totalComments / stats.totalPosts).toFixed(2) : 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10">
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 px-6 py-5 flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.5 1.5H5.75A2.25 2.25 0 003.5 3.75v12.5A2.25 2.25 0 005.75 18.5h8.5a2.25 2.25 0 002.25-2.25V9" stroke="white" strokeWidth="1.5" fill="none"/>
                <path d="M7 7a2 2 0 11-4 0 2 2 0 014 0z" fill="white"/>
                <path d="M14 13c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" fill="white"/>
              </svg>
              <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Quản lý người dùng</h2>
              <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm font-semibold text-white">{users.length}</span>
            </div>
            <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
              {users.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Không có user
                </div>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="px-6 py-4 hover:bg-slate-800/50 transition-all border-l-4 border-l-transparent hover:border-l-blue-500 flex justify-between items-center group">
                    <div className="flex-1">
                      <p className="font-bold text-gray-100 group-hover:text-blue-300 transition-colors">{u.full_name || u.username}</p>
                      <p className="text-sm text-gray-400">{u.email}</p>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${u.status === 'banned' || u.is_banned ? 'bg-red-900/40 text-red-300 border border-red-500/30' : 'bg-green-900/40 text-green-300 border border-green-500/30'}`}>
                        {u.status === 'banned' || u.is_banned ? 'Bị ban' : 'Hoạt động'}
                      </span>
                    </div>
                    <button
                      className={`font-bold px-5 py-2 rounded-lg transition-all shadow-lg scale-100 hover:scale-105 text-white ${
                        u.status === 'banned' || u.is_banned
                          ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 hover:shadow-green-500/50'
                          : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 hover:shadow-red-500/50'
                      }`}
                      onClick={() => (u.status === 'banned' || u.is_banned) ? unbanUser(u.id) : banUser(u.id)}
                    >
                      {u.status === 'banned' || u.is_banned ? 'Bỏ Ban' : 'Ban'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10">
            <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 px-6 py-5 flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
              </svg>
              <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Quản lý bài viết</h2>
              <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm font-semibold text-white">{posts.length}</span>
            </div>
            <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
              {posts.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Không có bài viết
                </div>
              ) : (
                posts.map((p) => (
                  <div key={p.id} className="px-6 py-4 hover:bg-slate-800/50 transition-all border-l-4 border-l-transparent hover:border-l-purple-500 group">
                    {editingId === p.id ? (
                      <div className="space-y-2 mb-3">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full p-3 bg-slate-800 border border-purple-500/50 rounded-lg text-sm text-gray-100 focus:border-purple-400 focus:outline-none"
                          rows="3"
                        />
                        <div className="flex gap-2">
                          <button
                            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold px-4 py-2 rounded-lg transition-all shadow-lg"
                            onClick={() => saveEdit('post', p.id)}
                          >
                            Lưu
                          </button>
                          <button
                            className="bg-slate-700 hover:bg-slate-600 text-gray-200 font-bold px-4 py-2 rounded-lg transition-all"
                            onClick={() => setEditingId(null)}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="font-semibold text-gray-100 group-hover:text-purple-300 mb-1 line-clamp-2 transition-colors">{p.content || p.text || '(Không có nội dung)'}</p>
                    )}
                    <p className="text-sm text-gray-400 mb-3">bởi <span className="text-purple-400 font-semibold">@{p.user?.username || p.User?.username || 'unknown'}</span></p>
                    <div className="flex gap-2">
                      <button
                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-blue-500/50 scale-100 hover:scale-105"
                        onClick={() => editPost(p.id, p.content || p.text || '')}
                      >
                        Sửa
                      </button>
                      <button
                        className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-red-500/50 scale-100 hover:scale-105"
                        onClick={() => deletePost(p.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10">
            <div className="bg-gradient-to-r from-green-600 via-green-500 to-green-400 px-6 py-5 flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
                <path fillRule="evenodd" d="M3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Quản lý bình luận</h2>
              <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm font-semibold text-white">{comments.length}</span>
            </div>
            <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Không có bình luận
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="px-6 py-4 hover:bg-slate-800/50 transition-all border-l-4 border-l-transparent hover:border-l-green-500 group">
                    <p className="text-sm text-gray-300 mb-2 font-bold uppercase tracking-wide"><span className="text-green-400">👤</span> {c.User?.username || c.user?.username || 'Unknown'}</p>
                    {editingId === c.id ? (
                      <div className="space-y-2 mb-3">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full p-3 bg-slate-800 border border-green-500/50 rounded-lg text-sm text-gray-100 focus:border-green-400 focus:outline-none"
                          rows="3"
                        />
                        <div className="flex gap-2">
                          <button
                            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold px-4 py-2 rounded-lg transition-all shadow-lg"
                            onClick={() => saveEdit('comment', c.id)}
                          >
                            Lưu
                          </button>
                          <button
                            className="bg-slate-700 hover:bg-slate-600 text-gray-200 font-bold px-4 py-2 rounded-lg transition-all"
                            onClick={() => setEditingId(null)}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-100 group-hover:text-green-300 mb-3 line-clamp-2 transition-colors">{c.content}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-blue-500/50 scale-100 hover:scale-105"
                        onClick={() => editComment(c.id, c.content || '')}
                      >
                        Sửa
                      </button>
                      <button
                        className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-red-500/50 scale-100 hover:scale-105"
                        onClick={() => deleteComment(c.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Filter Buttons */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setFilterReportType('all')}
                className={`px-5 py-2.5 rounded-lg font-bold uppercase tracking-wide transition-all scale-100 hover:scale-105 ${
                  filterReportType === 'all'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/50'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600 border border-slate-600'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilterReportType('post')}
                className={`px-5 py-2.5 rounded-lg font-bold uppercase tracking-wide transition-all scale-100 hover:scale-105 ${
                  filterReportType === 'post'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/50'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600 border border-slate-600'
                }`}
              >
                Bài viết
              </button>
              <button
                onClick={() => setFilterReportType('comment')}
                className={`px-5 py-2.5 rounded-lg font-bold uppercase tracking-wide transition-all scale-100 hover:scale-105 ${
                  filterReportType === 'comment'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/50'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600 border border-slate-600'
                }`}
              >
                Bình luận
              </button>
              <button
                onClick={() => setFilterReportType('pending')}
                className={`px-5 py-2.5 rounded-lg font-bold uppercase tracking-wide transition-all scale-100 hover:scale-105 ${
                  filterReportType === 'pending'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/50'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600 border border-slate-600'
                }`}
              >
                Chưa xử lý
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10">
              <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 px-6 py-5 flex items-center gap-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Báo cáo chi tiết</h2>
                <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm font-semibold text-white">{reports.filter(r => filterReportType === 'all' || r.type === filterReportType || (filterReportType === 'pending' && (r.status !== 'resolved' && !r.resolved))).length}</span>
              </div>
              <div className="divide-y divide-slate-700 max-h-full overflow-y-auto">
                {reports.filter(r => filterReportType === 'all' || r.type === filterReportType || (filterReportType === 'pending' && (r.status !== 'resolved' && !r.resolved))).length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Không có báo cáo
                  </div>
                ) : (
                  reports.filter(r => filterReportType === 'all' || r.type === filterReportType || (filterReportType === 'pending' && (r.status !== 'resolved' && !r.resolved))).map((r) => (
                    <div key={r.id} className="px-6 py-5 hover:bg-slate-800/50 transition-all border-l-4 border-l-orange-500 group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-bold text-gray-100 uppercase tracking-wide">Report #{r.id}</p>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                              r.type === 'post' ? 'bg-purple-900/40 text-purple-300 border border-purple-500/30' : 'bg-green-900/40 text-green-300 border border-green-500/30'
                            }`}>
                              {r.type === 'post' ? '📝 Bài viết' : '💬 Bình luận'}
                            </span>
                          </div>
                      <p className="text-sm text-orange-400 mb-2 font-semibold">📢 Báo cáo bởi: <span className="text-orange-300">{r.reporter?.username || 'Unknown'}</span></p>
                          <p className="text-gray-200 mb-2 font-semibold">👤 Người bị báo cáo: <span className="text-red-300">{r.reported_user?.username || 'Unknown'}</span></p>
                          <p className="text-gray-200 mb-2 font-semibold">🔍 Lý do: {r.reason}</p>
                          <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg mb-2">
                            <p className="text-xs text-gray-400 mb-1 font-bold uppercase">📄 Nội dung {r.type === 'post' ? 'bài viết' : 'bình luận'}:</p>
                            <p className="text-sm text-gray-100 line-clamp-3">{r.type === 'post' ? r.post?.content : r.comment?.content || '(Không có nội dung)'}</p>
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <span className={`inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide ${
                            r.status === 'resolved' || r.resolved 
                              ? 'bg-green-900/40 text-green-300 border border-green-500/30' 
                              : 'bg-yellow-900/40 text-yellow-300 border border-yellow-500/30'
                          }`}>
                            {r.status === 'resolved' || r.resolved ? '✓ Đã xử lý' : '⏳ Chưa xử lý'}
                          </span>
                        </div>
                      </div>

                      {(r.status !== 'resolved' && !r.resolved) && (
                        <div className="flex gap-2 pt-3 border-t border-slate-700 flex-wrap">
                          <button
                            className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-red-500/50 scale-100 hover:scale-105 text-sm uppercase tracking-wide"
                            onClick={() => r.type === 'post' ? rejectPost(r.post_id) : rejectComment(r.comment_id)}
                          >
                            🚫 {r.type === 'post' ? 'Ẩn bài' : 'Ẩn BL'}
                          </button>
                          <button
                            className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-green-500/50 scale-100 hover:scale-105 text-sm uppercase tracking-wide"
                            onClick={() => resolveReport(r.id)}
                          >
                            ✓ Xử lý
                          </button>
                          <button
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-gray-200 font-bold px-4 py-2 rounded-lg transition-all text-sm uppercase tracking-wide"
                            onClick={() => dismissReport(r.id)}
                          >
                            ↩ Bỏ qua
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10">
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 px-6 py-5 flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
              </svg>
              <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Quản lý Media</h2>
            </div>
            <div className="p-12 text-center">
              <svg className="w-20 h-20 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-300 text-lg font-semibold uppercase tracking-wide">Tính năng sẽ cập nhật sớm</p>
              <p className="text-gray-400 mt-2 text-sm">Xem, xóa hoặc quản lý các tệp media đã tải lên</p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 border border-white/10">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-lg font-bold text-gray-100 uppercase tracking-wide">{modal.msg}</p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold px-4 py-3 rounded-lg transition-all shadow-lg hover:shadow-red-500/50 uppercase tracking-wide"
                onClick={() => modal.onYes()}
              >
                Xác nhận
              </button>
              <button
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-gray-200 font-bold px-4 py-3 rounded-lg transition-all uppercase tracking-wide"
                onClick={closeModal}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
