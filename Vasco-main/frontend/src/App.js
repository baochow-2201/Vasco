  import React, { useState, useEffect, useRef } from "react";
import Logo from "./Logo";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import HomePage from "./HomePage";
import FriendList from "./FriendList";
import NotificationList from "./NotificationList";
import NewFeed from "./NewFeed";
import Profile from "./Profile";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import SettingPage from "./SettingPage"; 
import Chatsocket from "./ChatSocket";
import ChatBot from "./ChatBot";
import AdminPanel from "./AdminPanel";
import api from "./api";

export default function App() {
  const [screen, setScreen] = useState("logo"); 
  const [input1, setInput1] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const lastActiveRef = useRef(Date.now());

  // Check if user is already logged in - only on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken && screen === "logo") {
      setScreen("home");
    } else if (!savedToken && screen === "logo") {
      const timer = setTimeout(() => setScreen("login"), 5000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track user activity
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    // (use the top-level lastActiveRef to persist timestamp)
    const updateActivity = async () => {
      try {
        await api.updateActivity();
        lastActiveRef.current = Date.now();
      } catch (err) {
        console.error('Error updating activity:', err);
      }
    };

    // Update activity on component mount
    updateActivity();

    // Update activity every 5 minutes while user is logged in
    const interval = setInterval(updateActivity, 5 * 60 * 1000);

    // Update activity on user interactions
    const handleActivity = () => {
      const now = Date.now();
      // throttle activity events to once every 30 seconds max
      if (now - lastActiveRef.current > 30000) {
        updateActivity();
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  const handleLoginSuccess = () => {
    setScreen("home");
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setScreen("login");
  };

  return (
    <div>
      {screen === "logo" && <Logo />}
      {screen === "login" && (
        <LoginForm goToRegister={() => setScreen("register")} onLoginSuccess={handleLoginSuccess} />
      )}
      {screen === "register" && <RegisterForm goToLogin={() => setScreen("login")} />}

      {["home", "friends", "notifications", "newfeed", "profile", "setting", "chat", "search"].includes(screen) && (
        <>
            <Header 
             input1={input1} 
             onChangeInput1={setInput1} 
             onNavigate={setScreen}
             onLogout={handleLogout}
             onAdmin={() => setScreen("admin")}
             onSearchResults={(results) => {
               setSearchResults(results);
               setScreen("search");
             }}
            />
          <Sidebar onNavigate={setScreen} />
          <div className="pt-[140px] pl-[100px] pr-6 min-h-screen">
            {screen === "home" && <HomePage />} 
            {screen === "friends" && <FriendList />}
            {screen === "notifications" && <NotificationList />}
            {screen === "newfeed" && <NewFeed />}
            {screen === "profile" && <Profile />}
            {screen === "setting" && <SettingPage goBack={() => setScreen('home')} />} 
            {screen === "chat" && <Chatsocket goBack={() => setScreen('home')} />}
            {screen === "search" && searchResults.length > 0 && (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-black mb-4">Kết quả tìm kiếm: {searchResults.length} người dùng</h2>
                <div className="grid gap-4">
                  {searchResults.map((user) => (
                    <div 
                      key={user.id} 
                      className="bg-white p-4 rounded-lg shadow flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => {
                        // Lưu user vào sessionStorage để HomePage có thể lấy
                        sessionStorage.setItem('viewUserProfile', JSON.stringify(user));
                        setScreen('home');
                      }}
                    >
                      <img
                        src={user.user_profile?.avatar_url || "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/qdvbauSaaE/oadiyd0v_expires_30_days.png"}
                        className="w-16 h-16 rounded-full object-cover"
                        alt={user.full_name}
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-black">{user.full_name || user.username}</h3>
                        <p className="text-gray-600">@{user.username}</p>
                        {user.bio && <p className="text-gray-700 text-sm mt-1">{user.bio}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <ChatBot />
        </>
      )}

      {screen === "admin" && (
        <>
          <Header 
            input1={input1} 
            onChangeInput1={setInput1} 
            onNavigate={setScreen}
            onLogout={handleLogout}
            onAdmin={() => setScreen("admin")}   
          />
          <AdminPanel />
        </>
      )}
    </div>
  );
}
