import React, { useState } from "react";

// Các style chữ khác nhau
const styles = [
  {
    font: "fredoka",
    gradient: "from-pink-400 via-purple-300 to-cyan-300",
  },
  {
    font: "poppins",
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
  },
  {
    font: "montserrat",
    gradient: "from-yellow-400 via-red-400 to-pink-500",
  },
  {
    font: "raleway",
    gradient: "from-teal-400 via-blue-400 to-indigo-500",
  },
  {
    font: "bebas",
    gradient: "from-red-500 via-orange-400 to-yellow-400",
  },
];

export default function Logo() {
  const [styleIndex, setStyleIndex] = useState(0);

  const handleChangeStyle = () => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * styles.length);
    } while (newIndex === styleIndex); // tránh trùng style hiện tại
    setStyleIndex(newIndex);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4
                    bg-gradient-to-br from-pink-300 via-purple-200 to-cyan-200">
      {/* Text "vasco" */}
      <div className="mb-8 text-center">
        <span
          className={`text-6xl md:text-9xl font-bold font-${styles[styleIndex].font} 
                      text-transparent bg-clip-text bg-gradient-to-r ${styles[styleIndex].gradient}`}
        >
          vasco
        </span>
      </div>

      {/* Mascot với khung xoay tròn */}
      <div className="relative flex flex-col items-center">
        {/* Khung xoay tròn */}
        <div className="absolute w-52 h-52 md:w-72 md:h-72 rounded-full border-4 border-pink-400 animate-spin-slow"></div>

        {/* Mascot lắc lư */}
        <img
          src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/nm4j1a3y_expires_30_days.png"
          alt="Mascot"
          className="w-48 h-48 md:w-64 md:h-64 z-10 rounded-full shadow-lg animate-sway"
        />
      </div>

      {/* Slogan */}
      <div className="mt-8 text-center">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
          Kết nối - Học tập - Giải trí - Sáng tạo
        </h1>
        <p className="text-sm text-gray-600 mt-2">By: KBKHC</p>
      </div>

      {/* Nút đổi style */}
      <button
        onClick={handleChangeStyle}
        className="mt-6 px-6 py-2 rounded-full bg-purple-200 text-white font-semibold hover:bg-purple-600 transition"
      >
        Change Style
      </button>
    </div>
  );
}
