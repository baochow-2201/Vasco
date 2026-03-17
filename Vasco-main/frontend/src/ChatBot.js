import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';
import { ChatBubbleIcon, SendIcon, CloseIcon } from './ChatBotIcons';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'Chào bạn! Mình là Vasco Bot, có thể giúp gì cho bạn?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputValue
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputValue })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      
      // Add bot message
      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: data.reply || 'Xin lỗi, mình không hiểu. Bạn có thể hỏi lại không?'
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chatbot Button - SVG Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-125 transition-all duration-300 z-40 flex items-center justify-center border-4 border-white ${isOpen ? 'animate-pulse' : 'animate-bounce'}`}
        title={isOpen ? 'Đóng ChatBot' : 'Mở ChatBot'}
      >
        {isOpen ? <CloseIcon /> : <ChatBubbleIcon />}
      </button>

      {/* Chatbot Window - SVG Themed */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden z-40 animate-slideIn border-4 border-blue-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white p-5 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <rect x="4" y="2" width="16" height="16" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
                <rect x="6" y="4" width="3" height="3" rx="0.5" fill="white" />
                <rect x="15" y="4" width="3" height="3" rx="0.5" fill="white" />
                <circle cx="12" cy="13" r="2" fill="white" />
                <path d="M7 20 Q12 22 17 20" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </svg>
              <div>
                <h3 className="font-bold text-xl">Vasco Bot</h3>
                <p className="text-xs opacity-90">Trợ lý thông minh của bạn</p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.type === 'bot' && (
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <rect x="4" y="2" width="16" height="16" rx="2" stroke="white" strokeWidth="1" fill="none"/>
                      <circle cx="8" cy="6" r="1" fill="white" />
                      <circle cx="16" cy="6" r="1" fill="white" />
                      <circle cx="12" cy="12" r="1.5" fill="white" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-xs px-4 py-3 rounded-2xl ${
                    msg.type === 'user'
                      ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-br-none shadow-md'
                      : 'bg-white text-gray-800 rounded-bl-none border-2 border-blue-200 shadow-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <rect x="4" y="2" width="16" height="16" rx="2" stroke="white" strokeWidth="1" fill="none"/>
                    <circle cx="8" cy="6" r="1" fill="white" />
                    <circle cx="16" cy="6" r="1" fill="white" />
                    <circle cx="12" cy="12" r="1.5" fill="white" />
                  </svg>
                </div>
                <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-bl-none border-2 border-blue-200 shadow-md">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={sendMessage} className="border-t-4 border-blue-300 p-4 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Hỏi gì đó..."
                className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-400 text-sm font-medium placeholder-gray-500 bg-blue-50"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-400 to-blue-600 text-white px-4 py-2 rounded-full hover:shadow-lg disabled:opacity-50 transition-all duration-300 font-bold flex items-center gap-2 border-2 border-blue-600"
              >
                <SendIcon />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;
