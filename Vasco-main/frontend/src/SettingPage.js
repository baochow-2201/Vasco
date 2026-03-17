import React, { useState } from "react";
import { api } from "./api";

export default function SettingPage({ goBack }) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privacy, setPrivacy] = useState("friends"); // friends | everyone | onlyme
  
  // Change password states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Vui lòng điền đầy đủ thông tin");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu mới không khớp");
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    
    if (newPassword === oldPassword) {
      setPasswordError("Mật khẩu mới phải khác mật khẩu cũ");
      return;
    }

    setIsChangingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const res = await api.changePassword(oldPassword, newPassword);
      if (res.success || res.message?.includes("successfully")) {
        setPasswordSuccess("Thay đổi mật khẩu thành công!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowChangePassword(false);
          setPasswordSuccess("");
        }, 2000);
      } else {
        setPasswordError(res.message || "Không thể thay đổi mật khẩu");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setPasswordError("Mật khẩu cũ không chính xác hoặc có lỗi khi thay đổi");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      window.location.href = "/";
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Cài đặt</h1>
          <p className="text-slate-600">Quản lý tài khoản và bảo mật của bạn</p>
        </div>

        {/* Đổi mật khẩu */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 hover:shadow-lg transition-shadow">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 py-4 px-6 cursor-pointer flex items-center justify-between group"
            onClick={() => setShowChangePassword(!showChangePassword)}
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm6-10V7a3 3 0 00-3-3H9a3 3 0 00-3 3v4h12V7z" />
              </svg>
              <span className="text-white font-semibold text-lg">Đổi mật khẩu</span>
            </div>
            <svg className={`w-5 h-5 text-white transition-transform ${showChangePassword ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          {showChangePassword && (
            <div className="p-6 space-y-4 bg-gradient-to-b from-blue-50 to-white">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu cũ</label>
                <input 
                  type="password" 
                  placeholder="Nhập mật khẩu hiện tại" 
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu mới</label>
                <input 
                  type="password" 
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Xác nhận mật khẩu</label>
                <input 
                  type="password" 
                  placeholder="Xác nhận mật khẩu mới" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              {passwordError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 text-sm">{passwordError}</span>
                </div>
              )}
              {passwordSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-4">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-700 text-sm">{passwordSuccess}</span>
                </div>
              )}
              <button 
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 transition shadow-md hover:shadow-lg"
              >
                {isChangingPassword ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          )}
        </div>

        {/* Thông báo */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0120 15.171V11a6 6 0 00-12 0v4.171A2.032 2.032 0 004.405 15.405L3 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Thông báo</h3>
                <p className="text-sm text-slate-600">Nhận thông báo tin nhắn và cập nhật</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notificationsEnabled}
                onChange={() => setNotificationsEnabled(!notificationsEnabled)}
              />
              <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>

        {/* Quyền riêng tư */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 hover:shadow-lg transition-shadow">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 py-4 px-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm6-10V7a3 3 0 00-3-3H9a3 3 0 00-3 3v4h12V7z" />
              </svg>
              <span className="text-white font-semibold text-lg">Quyền riêng tư</span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[
              { value: "friends", label: "Bạn bè" },
              { value: "everyone", label: "Mọi người" },
              { value: "onlyme", label: "Chỉ tôi" }
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition">
                <input 
                  type="radio" 
                  name="privacy" 
                  value={option.value} 
                  checked={privacy === option.value}
                  onChange={() => setPrivacy(option.value)}
                  className="w-4 h-4 accent-purple-500"
                />
                <span className="font-medium text-slate-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Nút đăng xuất */}
        <div className="flex justify-center">
          <button 
            onClick={handleLogout}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-12 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
