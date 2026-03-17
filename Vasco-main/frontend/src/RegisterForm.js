import React, { useState } from "react";
import api from './api';

export default function RegisterForm({ goToLogin }) {
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    display_name: "",
    mssv: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // 🧩 Xử lý thay đổi input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🧩 Xử lý submit form
  const handleSubmit = async () => {
    const {
      username,
      full_name,
      display_name,
      mssv,
      email,
      password,
      confirmPassword,
    } = formData;

    // Kiểm tra dữ liệu hợp lệ
    if (
      !username ||
      !full_name ||
      !display_name ||
      !mssv ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      alert("⚠️ Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (!/^[0-9]{1,10}$/.test(mssv)) {
      alert("🎓 MSSV phải là số và tối đa 10 ký tự!");
      return;
    }
    if (password !== confirmPassword) {
      alert("❌ Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      const data = await api.register({ username, full_name, display_name, mssv, email, password });
      if (data && data.success) {
        alert('🎉 ' + data.message);
        // if token returned, save it
        if (data.data && data.data.token) {
          sessionStorage.setItem('token', data.data.token);
          sessionStorage.setItem('user', JSON.stringify(data.data.user));
        }
        goToLogin();
      } else {
        alert('❌ ' + (data.message || 'Đăng ký thất bại!'));
      }
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      alert("⚠️ Không thể kết nối đến server!");
    }
  };

  // 🧱 Giao diện form đăng ký
  return (
    <div className="min-h-screen bg-blue-400 flex justify-center items-start py-20">
      <div className="bg-blue-300 rounded-xl shadow-lg w-full max-w-[800px] p-16 flex flex-col items-center">

        <span className="text-black text-3xl font-semibold mb-12">
          ĐĂNG KÝ TÀI KHOẢN
        </span>

        <input
          placeholder="Tên đăng nhập"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="w-full max-w-[600px] text-black text-2xl py-4 px-6 mb-4 rounded-lg border border-gray-300 
          focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        <input
          placeholder="Họ và tên"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          className="w-full max-w-[600px] text-black text-2xl py-4 px-6 mb-4 rounded-lg border border-gray-300 
          focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        <input
          placeholder="Tên hiển thị"
          name="display_name"
          value={formData.display_name}
          onChange={handleChange}
          className="w-full max-w-[600px] text-black text-2xl py-4 px-6 mb-4 rounded-lg border border-gray-300 
          focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        <input
          placeholder="MSSV"
          name="mssv"
          value={formData.mssv}
          onChange={handleChange}
          className="w-full max-w-[600px] text-black text-2xl py-4 px-6 mb-4 rounded-lg border border-gray-300 
          focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        <input
          placeholder="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full max-w-[600px] text-black text-2xl py-4 px-6 mb-4 rounded-lg border border-gray-300 
          focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        <input
          placeholder="Mật khẩu"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full max-w-[600px] text-black text-2xl py-4 px-6 mb-4 rounded-lg border border-gray-300 
          focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        <input
          placeholder="Xác nhận mật khẩu"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full max-w-[600px] text-black text-2xl py-4 px-6 mb-6 rounded-lg border border-gray-300 
          focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        <button
          onClick={handleSubmit}
          className="w-full max-w-[300px] bg-blue-300 hover:bg-blue-400 text-black text-2xl py-3 mb-4 rounded-lg 
          border border-black transition"
        >
          Đăng ký
        </button>

        <button
          onClick={goToLogin}
          className="w-full max-w-[300px] text-blue-700 underline mb-4 transition"
        >
          Quay về đăng nhập
        </button>

        <span className="text-black text-lg text-center">
          Đăng ký rồi thì nhớ đăng nhập nhé
        </span>
      </div>
    </div>
  );
}
