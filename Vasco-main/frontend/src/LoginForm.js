import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import api, { BASE } from './api';

// 🔥 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC2m44SeE5pFxPHfvFzLEah2ZS4RmvozGM",
  authDomain: "doan-ae7b4.firebaseapp.com",
  databaseURL: "https://doan-ae7b4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "doan-ae7b4",
  storageBucket: "doan-ae7b4.firebasestorage.app",
  messagingSenderId: "242852446801",
  appId: "1:242852446801:web:28e36ccf602a01749f2e70",
  measurementId: "G-Y8W6XVMZQK"
};

// 🔧 Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function LoginForm(props) {
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  const [loggedUser, setLoggedUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  let ChatSocket = null;
  try {
    ChatSocket = require('./ChatSocket').default;
  } catch (e) {
    ChatSocket = null;
  }

  // 🧩 Xử lý đăng nhập bằng Google
  const handleGoogleLogin = async () => {
    try {
      console.log('🔹 Bắt đầu đăng nhập Google...');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('✅ Google login thành công:', user);

      // 👉 Tạo username từ email (lấy phần trước @)
      const username = user.email.split("@")[0];

      // 👉 Gửi thông tin lên server
      const response = await fetch(`${BASE}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          username,
          email: user.email,
          display_name: user.displayName,
          provider: "google"
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server error response:", errorText);
        throw new Error(`Server error: ${errorText}`);
      }

      const data = await response.json();
      console.log("📦 Server response:", data);

      // 👉 Tạo user object cho ứng dụng
      const userObj = {
        id: data.data?.user?.id || data.user?.id || data.user?.username || data.user?.email,
        username: data.data?.user?.username || data.user?.username || username,
        email: user.email,
        display_name: user.displayName
      };

      setLoggedUser(userObj);
      // server returns { success, message, data: { token, user } }
      if (data && data.data && data.data.token) setAuthToken(data.data.token);

      // Lưu token vào localStorage (same as regular login)
      if (data && data.data && data.data.token) {
        localStorage.setItem('token', data.data.token);
      }
      
      // Fetch user profile from database to get full_name and avatar
      try {
        const profileData = await api.getUserProfile(userObj.id);
        console.log('📦 User profile data:', profileData);
        
        // Merge user data with profile data
        const mergedUser = {
          ...userObj,
          display_name: profileData.full_name?.trim() || userObj.display_name || userObj.username,
          user_profile: {
            full_name: profileData.full_name || '',
            avatar_url: profileData.avatar_url || '',
            bio: profileData.bio || ''
          }
        };
        
        localStorage.setItem('user', JSON.stringify(mergedUser));
        console.log('✅ Local storage updated with merged user data');
        setLoggedUser(mergedUser);
      } catch (profileErr) {
        console.error('⚠️ Error fetching profile, using basic user data:', profileErr);
        // Fallback to basic user data if profile fetch fails
        localStorage.setItem('user', JSON.stringify(userObj));
      }

      if (props.onLoginSuccess) props.onLoginSuccess(userObj);

    } catch (error) {
      console.error("🚫 Lỗi trong quá trình đăng nhập Google:", error);
      alert(`Đăng nhập thất bại: ${error.message}`);
    }
  };

  const handleLogin = async () => {
    try {
      console.log('🔹 Attempting login with:', { username: input1, password: input2 ? '***' : '' });
      const data = await api.login(input1, input2);
      console.log('📦 Login response:', data);
      
      if (data && data.success) {
        console.log('✅ Login success, data:', data.data);
        if (data.data && data.data.token) {
          localStorage.setItem('token', data.data.token);
          
          // Fetch user profile from database to get full_name and avatar
          try {
            const profileData = await api.getUserProfile(data.data.user.id);
            console.log('📦 User profile data:', profileData);
            
            // Merge user data with profile data
            const mergedUser = {
              ...data.data.user,
              display_name: profileData.full_name?.trim() || data.data.user.display_name || data.data.user.full_name || data.data.user.username,
              user_profile: {
                full_name: profileData.full_name || '',
                avatar_url: profileData.avatar_url || '',
                bio: profileData.bio || ''
              }
            };
            
            localStorage.setItem('user', JSON.stringify(mergedUser));
            console.log('✅ Local storage updated with merged user data');
            setLoggedUser(mergedUser);
          } catch (profileErr) {
            console.error('⚠️ Error fetching profile, using basic user data:', profileErr);
            // Fallback to basic user data if profile fetch fails
            localStorage.setItem('user', JSON.stringify(data.data.user));
            setLoggedUser(data.data.user);
          }
          
          console.log('✅ Calling onLoginSuccess callback');
          if (props.onLoginSuccess) props.onLoginSuccess(data.data.user);
        }
      } else {
        console.error('❌ Login failed:', data?.message);
        alert(data?.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      console.error('🚫 Error login:', err);
      alert('Lỗi đăng nhập: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-blue-400 flex justify-center items-start py-20">
      <div className="bg-blue-300 rounded-xl shadow-lg w-full max-w-[800px] p-16 flex flex-col items-center">
        
        <span className="text-black text-3xl font-semibold mb-12">
          ĐĂNG NHẬP NHÉ
        </span>

        <input
          placeholder="MSSV"
          value={input1}
          onChange={(e) => setInput1(e.target.value)}
          className="w-full max-w-[600px] text-black text-2xl py-4 px-6 mb-6 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        <input
          placeholder="Mật khẩu"
          value={input2}
          onChange={(e) => setInput2(e.target.value)}
          type="password"
          className="w-full max-w-[600px] text-black text-2xl py-4 px-6 mb-6 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        <button
          onClick={() => alert("Quên mật khẩu")}
          className="self-start mb-4 text-blue-400 font-medium underline"
        >
          Quên mật khẩu
        </button>

        <button
          onClick={handleLogin}
          className="w-full max-w-[300px] bg-blue-300 hover:bg-blue-400 text-black text-2xl py-3 mb-4 rounded-lg border border-black transition"
        >
          Let's go
        </button>

        <button
          onClick={props.goToRegister}
          className="w-full max-w-[300px] bg-white hover:bg-blue-400 text-black text-2xl py-3 mb-4 rounded-lg border border-black transition"
        >
          Đăng ký
        </button>

        <button
          onClick={handleGoogleLogin}
          className="w-full max-w-[300px] bg-white hover:bg-blue-400 text-black text-xl py-3 mb-6 rounded-lg border border-gray-300 flex items-center justify-center gap-2 transition"
        >
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google icon" 
            className="w-6 h-6"
          />
          Đăng nhập với Google
        </button>

        <span className="text-black text-lg text-center">
          Nhập để được tham gia với chúng tớ nào!!!
        </span>

        {loggedUser && ChatSocket ? (
          <div className="mt-8">
            <ChatSocket serverUrl={BASE} user={loggedUser} token={authToken} goBack={() => {}} />
          </div>
        ) : null}

      </div>
    </div>
  );
}
