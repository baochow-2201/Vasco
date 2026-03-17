import React from "react";

export default function Sidebar({ onNavigate }) {
  return (
    <div className="fixed top-[140px] left-0 flex flex-col items-center bg-[#88BCF8] w-[60px] py-[10px] px-[10px] gap-[28px] z-40 rounded-tr-[10px] rounded-br-[10px] shadow-md">
      {/* Trang chủ */}
      <img
        src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/z80zbu4e_expires_30_days.png"
        className="w-[42px] h-[42px] cursor-pointer hover:scale-110 transition"
        onClick={() => onNavigate("home")}
      />
      {/* notifications */}
      <img
        src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/t1arv6nw_expires_30_days.png"
        className="w-[42px] h-[42px] cursor-pointer hover:scale-110 transition"
        onClick={() => onNavigate("notifications")}
      />

      {/* friends */}
      <img
        src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/kzqsuwac_expires_30_days.png"
        className="w-[42px] h-[42px] cursor-pointer hover:scale-110 transition"
        onClick={() => onNavigate("friends")}
      />

            {/* 📰 NewFeed (Bảng tin) */}
      <img
        src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/we7hqzlh_expires_30_days.png"
        className="w-[42px] h-[42px] cursor-pointer hover:scale-110 transition"
        onClick={() => onNavigate("newfeed")}
      />

      {/* profile*/}
      <img
        src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/nhuu7doy_expires_30_days.png"
        className="w-[42px] h-[42px] cursor-pointer hover:scale-110 transition"
        onClick={() => onNavigate("profile")}
      />
      {/* setting*/}
      <img
        src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/85yw2g0g_expires_30_days.png"
        className="w-[40px] h-[40px] cursor-pointer hover:scale-110 transition"
        onClick={() => onNavigate("setting")}
      />
    </div>
  );
}
