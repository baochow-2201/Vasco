import React from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Header({ input1, onChangeInput1, onNavigate, onAdmin, onSearchResults }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleSearch = async () => {
    if (!input1.trim()) {
      return;
    }
    
    try {
      // Tìm kiếm người dùng theo tên
      const response = await api.fetchUsers();
      const users = Array.isArray(response) ? response : response.data || [];
      
      // Lọc theo tên hoặc username
      const results = users.filter(u => 
        (u.full_name && u.full_name.toLowerCase().includes(input1.toLowerCase())) ||
        (u.username && u.username.toLowerCase().includes(input1.toLowerCase())) ||
        (u.display_name && u.display_name.toLowerCase().includes(input1.toLowerCase()))
      );
      
      // Nếu có kết quả, chuyển sang screen kết quả tìm kiếm
      if (results.length > 0) {
        onSearchResults?.(results);
      } else {
        alert('Không tìm thấy người dùng nào');
      }
    } catch (err) {
      console.error('Error searching users:', err);
      alert('Lỗi khi tìm kiếm');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 flex items-center justify-between bg-[#88BCF8] py-2 px-6 z-50 shadow-md">
      <div className="flex items-center flex-shrink-0">
        <img
          src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/d6pl6rwy_expires_30_days.png"    /* Vasco logo */
          className="w-[120px] h-[110px] object-fill"
        />
      </div>

     {/* Thanh tìm kiếm + nút tìm kiếm nằm cạnh nhau */}
<div className="flex items-center gap-2 max-w-[600px] w-full mx-6">
  <input
    placeholder="Nhập để tìm kiếm"
    value={input1}
    onChange={(e) => onChangeInput1(e.target.value)}
    onKeyPress={handleKeyPress}
    className="text-black bg-[#F6FEFF] text-base flex-1 py-2 px-5 rounded-[50px] border-0 outline-none"
  />
  <img
    src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/zwcjxgmf_expires_30_days.png"
    alt="search-icon"
    className="w-[30px] h-[30px] cursor-pointer hover:scale-110 transition-transform duration-200"
    onClick={handleSearch}
    title="Tìm kiếm"
  />
</div>

      <div className="flex items-center gap-5 flex-shrink-0">
        {/* Admin Button - Show only for admin users */}
        {user?.role === 'admin' && (
          <button
            onClick={() => onAdmin?.()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2 text-sm"
            title="Admin Panel"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 17v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd" />
            </svg>
            Admin
          </button>
        )}
        
        <button
          onClick={() => onNavigate("chat")}
          className="w-[30px] h-[30px] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 bg-transparent border-0 p-0"
          title="Messenger"
        >
          <img
            src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/ga5suwf5_expires_30_days.png"
            alt="messenger-icon"
            className="w-full h-full object-contain"
          />
        </button>

  <img
    src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/s3cony2d_expires_30_days.png"
    className="w-[30px] h-[30px] object-contain cursor-pointer hover:scale-110 transition-transform duration-200"
    alt="game-icon"
/>
</div>
    </div>
  );
}
