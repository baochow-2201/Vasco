import React, { useState, useEffect } from "react";
import api from './api';

export default function NotificationList({ goBack, onNotificationRead }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(null); // popup xem chi tiết

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  // Lấy token từ localStorage
  const getToken = () => sessionStorage.getItem('token');

  const fetchNotifications = async () => {
    try {
      const data = await api.fetchNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message || 'Không thể tải thông báo');
      console.error('Error fetching notifications:', err);
    }
  };

  // Chấp nhận lời mời kết bạn
  const acceptFriendRequest = async (requestId) => {
    try {
      const token = getToken();
      if (!token) {
        showToast('Bạn cần đăng nhập');
        return;
      }

      const data = await api.acceptFriendRequest(requestId);
      if (data) {
        showToast('Đã chấp nhận lời mời kết bạn');
        // Cập nhật trạng thái thông báo
        setNotifications(prev => prev.map(notif =>
          notif.id === requestId ? { ...notif, status: 'accepted' } : notif
        ));
        // Refresh danh sách thông báo
        fetchNotifications();
        // Notify parent component to refresh notification count
        if (onNotificationRead) onNotificationRead();
      } else {
        showToast(data.message || 'Không thể chấp nhận lời mời');
      }
    } catch (err) {
      showToast('Lỗi khi chấp nhận lời mời');
      console.error('Error accepting friend request:', err);
    }
  };

  // Từ chối lời mời kết bạn
  const rejectFriendRequest = async (requestId) => {
    try {
      const token = getToken();
      if (!token) {
        showToast('Bạn cần đăng nhập');
        return;
      }

      const data = await api.rejectFriendRequest(requestId);
      if (data) {
        showToast('Đã từ chối lời mời kết bạn');
        // Cập nhật trạng thái thông báo
        setNotifications(prev => prev.map(notif =>
          notif.id === requestId ? { ...notif, status: 'rejected' } : notif
        ));
        // Refresh danh sách thông báo
        fetchNotifications();
        // Notify parent component to refresh notification count
        if (onNotificationRead) onNotificationRead();
      } else {
        showToast(data.message || 'Không thể từ chối lời mời');
      }
    } catch (err) {
      showToast('Lỗi khi từ chối lời mời');
      console.error('Error rejecting friend request:', err);
    }
  };

  // Đánh dấu thông báo đã đọc
  const markAsRead = async (notificationId) => {
    try {
      await api.markNotificationRead(notificationId);
      setNotifications(prev => prev.map(notif => (notif.id === notificationId ? { ...notif, is_read: true } : notif)));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  useEffect(() => {
    fetchNotifications().finally(() => setLoading(false));
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

  // Tất cả thông báo
  const allNotifications = notifications;

  return (
    <div className="min-h-screen bg-gray-100 p-6 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Thông báo</h1>
        <button
          onClick={goBack}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
        >
          Quay lại
        </button>
      </div>

      <div className="flex gap-6">
        {/* Danh sách thông báo */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Tất cả thông báo */}
          <div>
            <h2 className="text-2xl font-bold mb-3">Tất cả thông báo ({allNotifications.length})</h2>
            {allNotifications.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Không có thông báo nào
              </div>
            ) : (
              allNotifications.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-4 rounded-lg shadow-sm mb-3 ${
                    item.is_read ? 'bg-[#F6FAFF]' : 'bg-[#E2F0FF]'
                  }`}
                  onClick={() => markAsRead(item.id)}
                >
                  <img
                    src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/kw5jvhez_expires_30_days.png"
                    alt="avatar"
                    className="w-[80px] h-[80px] rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-lg text-black font-semibold">{item.title}</p>
                    <p className="text-black text-sm">{item.message}</p>
                    <span className="text-gray-600 text-sm">
                      {new Date(item.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {item.type === 'friend_request' ? (
                      <>
                        <button
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                          onClick={() => acceptFriendRequest(item.data?.request_id)}
                        >
                          Chấp nhận
                        </button>
                        <button
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                          onClick={() => rejectFriendRequest(item.data?.request_id)}
                        >
                          Từ chối
                        </button>
                      </>
                    ) : (
                      <button
                        className="bg-[#88BCF8] text-white px-4 py-1 rounded-lg hover:bg-[#63A4F8]"
                        onClick={() => setSelected(item)}
                      >
                        Xem chi tiết
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cột thống kê */}
        <div className="w-[300px] flex flex-col gap-3">
          <h2 className="text-2xl font-bold mb-3">Thống kê</h2>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-lg font-semibold mb-2">Tổng quan</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tổng cộng:</span>
                <span className="font-semibold">{allNotifications.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup xem chi tiết */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-[400px] p-6 relative">
            <h3 className="text-2xl font-semibold mb-3 text-[#0056A6]">
              Chi tiết thông báo
            </h3>
            <p className="text-black mb-2 font-semibold">{selected.title}</p>
            <p className="text-black mb-4">{selected.message}</p>
            <div className="text-gray-500 text-sm">
              Thời gian: {new Date(selected.created_at).toLocaleString('vi-VN')}
            </div>
            {selected.data && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <div className="text-sm text-gray-600">Dữ liệu bổ sung:</div>
                <pre className="text-xs mt-1">{JSON.stringify(selected.data, null, 2)}</pre>
              </div>
            )}

            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-4 text-gray-500 hover:text-black text-xl"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="8" y1="8" x2="16" y2="16" />
                <line x1="16" y1="8" x2="8" y2="16" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
