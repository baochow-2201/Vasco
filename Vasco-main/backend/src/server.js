// server.js
require("dotenv").config();
const http = require("http");
const express = require("express");
const app = require("./app");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const db = require("./models");
const TriggerListenerService = require("./services/trigger-listener.service");

// Tạo HTTP server
const server = http.createServer(app);

// SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Gắn io vào app để controller có thể emit
app.set("io", io);

// Initialize trigger listener for real-time message delivery
let triggerListener = null;

// Realtime feature toggle
const realtimeEnabled = process.env.ENABLE_REALTIME !== 'false';
app.set('realtimeEnabled', realtimeEnabled);

// SOCKET EVENTS
io.on("connection", (socket) => {
  // Decode token từ auth
  let userId = null;
  try {
    const token = socket.handshake.auth?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
      userId = decoded.userId || decoded.id;
      socket.userId = userId;
      console.log("🔥 Client connected:", socket.id, "| User:", userId);
    } else {
      console.log("🔥 Client connected:", socket.id, "| No auth token");
    }
  } catch (err) {
    console.error("❌ Token verification error:", err.message);
  }

  // Join room dựa vào conversation_id
  socket.on("join:conversation", (data) => {
    const conversationId = typeof data === 'object' ? data.room || data.conversationId : data;
    socket.join(`conversation_${conversationId}`);
    console.log(`✅ User ${userId} joined room conversation_${conversationId}`);
  });

  // Join user-specific room for notifications
  socket.on("join:user", (data) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`✅ User ${userId} joined user room`);
    }
  });

  // Rời room
  socket.on("leave:conversation", (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
  });

  // Auto join user room on connect if authenticated
  if (userId) {
    socket.join(`user_${userId}`);
  }

  // Tin nhắn public (broadcast tới tất cả clients)
  socket.on("message", async (data) => {
    console.log("💬 Public message received:", { userId: socket.userId, text: data.text?.substring(0, 30), media_url: data.media_url ? 'has media' : 'no media' });
    
    try {
      // Save message to database
      const { Message, Conversation, User, UserProfile } = db;
      
      // Get or create public chat conversation
      let publicConversation = await Conversation.findOne({
        where: { is_group: true, name: "Public Chat" }
      });
      
      if (!publicConversation) {
        console.log("📝 Creating new public chat conversation");
        publicConversation = await Conversation.create({
          is_group: true,
          name: "Public Chat",
          created_by: socket.userId || 1
        });
      }
      
      console.log("💾 Saving message to database:", { 
        conversation_id: publicConversation.id,
        sender_id: socket.userId || 1,
        content: data.text,
        media_url: data.media_url
      });
      
      // Create message in database
      const message = await Message.create({
        conversation_id: publicConversation.id,
        sender_id: socket.userId || 1,
        receiver_id: null,
        content: data.text || "",
        media_url: data.media_url || null
      });
      
      console.log("✅ Message saved with ID:", message.id);
      
      // Fetch full message with sender info
      const fullMessage = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: "sender",
            attributes: ["id", "username"],
            include: [
              {
                model: UserProfile,
                as: "user_profile",
                attributes: ["full_name", "avatar_url"]
              }
            ]
          }
        ]
      });
      
      console.log("📤 Broadcasting message:", { id: fullMessage.id, content: fullMessage.content });
      
      // Broadcast to all clients
      io.emit("message", {
        id: fullMessage.id,
        text: fullMessage.content,
        content: fullMessage.content,
        media_url: fullMessage.media_url,
        sender_id: fullMessage.sender_id || socket.userId || "anonymous",
        from: {
          id: fullMessage.sender_id,
          username: fullMessage.sender?.username || `user_${socket.userId}`,
          display_name: fullMessage.sender?.user_profile?.full_name || fullMessage.sender?.username || `User ${socket.userId}`
        },
        created_at: fullMessage.created_at,
        timestamp: new Date()
      });
    } catch (err) {
      console.error("❌ Error saving public message:", err.message, err.stack);
      // Still broadcast even if save fails
      io.emit("message", {
        ...data,
        sender_id: socket.userId || "anonymous",
        from: {
          id: socket.userId,
          username: `user_${socket.userId}`,
          display_name: `User ${socket.userId}`
        },
        timestamp: new Date()
      });
    }
  });

  // Tin nhắn real-time (nếu muốn xử lý)
  socket.on("send:message", (data) => {
    console.log("📨 Real-time message event:", data);
    io.to(`conversation_${data.conversation_id}`).emit("receive:message", data);
  });

  // Handle typing indicator
  socket.on("typing", (data) => {
    io.to(`conversation_${data.conversation_id}`).emit("user:typing", {
      userId,
      conversationId: data.conversation_id,
      isTyping: data.isTyping
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// KẾT NỐI DATABASE
db.sequelize.authenticate()
  .then(() => console.log("📌 Database connected"))
  .catch((err) => console.error("❌ Database connection error:", err));

// SYNC MODELS (chỉ dùng khi dev)
const alterSchema = process.env.DB_SYNC_ALTER === 'true';
db.sequelize.sync({ alter: alterSchema })
  .then(() => console.log("📌 Models synchronized"))
  .catch((err) => console.error("❌ Sync error:", err));

// PORT
const PORT = process.env.PORT || 5000;

// START SERVER
const startServer = async () => {
  try {
    const listener = server.listen(PORT, async () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      
      // Initialize trigger listener for real-time messages if enabled
      if (realtimeEnabled) {
        triggerListener = new TriggerListenerService(io);
        await triggerListener.initialize(db.sequelize);
      } else {
        console.log("⚠️ Real-time message triggers are DISABLED (ENABLE_REALTIME=false)");
      }
    });

    // Graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down gracefully...");
      if (triggerListener) {
        triggerListener.close();
      }
      listener.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
};

startServer();
