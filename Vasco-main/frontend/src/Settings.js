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
    <div className="bg-white min-h-screen flex flex-col items-center">
      <div className="max-w-[1440px] w-full flex flex-col px-20 mt-12">

        {/* Đổi mật khẩu */}
        <div 
          className="bg-[#C6E1FF85] py-3 px-6 rounded-md cursor-pointer"
          onClick={() => setShowChangePassword(!showChangePassword)}
        >
          <span className="text-black font-bold text-base">Đổi mật khẩu</span>
        </div>
        {showChangePassword && (
          <div className="bg-[#E0F0FF] p-6 rounded-md mt-2 flex flex-col gap-4 w-96">
            <input 
              type="password" 
              placeholder="Mật khẩu cũ" 
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="border p-2 rounded"
            />
            <input 
              type="password" 
              placeholder="Mật khẩu mới" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border p-2 rounded"
            />
            <input 
              type="password" 
              placeholder="Xác nhận mật khẩu" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border p-2 rounded"
            />
            {passwordError && <div className="text-red-500 text-sm">{passwordError}</div>}
            {passwordSuccess && <div className="text-green-500 text-sm">{passwordSuccess}</div>}
            <button 
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="bg-blue-400 text-white py-2 rounded-md font-medium hover:bg-blue-500 disabled:bg-gray-400"
            >
              {isChangingPassword ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        )}

        {/* Thông báo */}
        <div className="bg-[#C6E1FF85] py-3 px-6 rounded-md flex items-center justify-between mt-6">
          <span className="text-black font-bold text-base">Thông báo</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={notificationsEnabled}
              onChange={() => setNotificationsEnabled(!notificationsEnabled)}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-400 peer-focus:ring-2 peer-focus:ring-blue-300 transition-all"></div>
          </label>
        </div>

        {/* Quyền riêng tư */}
        <div className="bg-[#C6E1FF85] py-3 px-6 rounded-md mt-6 flex flex-col gap-2">
          <span className="text-black font-bold text-base">Quyền riêng tư</span>
          <div className="flex flex-col mt-2 gap-2">
            {["friends", "everyone", "onlyme"].map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="privacy" 
                  value={option} 
                  checked={privacy === option}
                  onChange={() => setPrivacy(option)}
                  className="accent-blue-400"
                />
                <span className="capitalize">
                  {option === "friends" ? "Bạn bè" : option === "everyone" ? "Mọi người" : "Chỉ tôi"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Nút đăng xuất */}
        <div className="flex justify-center mt-12 mb-8">
          <button 
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-10 rounded-[20px] font-medium transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
