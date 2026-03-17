// src/services/trigger-listener.service.js
// Service to listen to PostgreSQL triggers and emit socket events

const db = require("../models");

class TriggerListenerService {
  constructor(io) {
    this.io = io;
    this.client = db.sequelize;
    this.userCache = new Map(); // in-memory cache for user profiles (reduce DB calls)
  }

  async initialize() {
    try {
      // Create a separate connection for listening to notifications
      const { Sequelize } = require("sequelize");
      
      // Ensure password is a string
      const dbPassword = process.env.DB_PASS || process.env.DB_PASSWORD || "";
      if (!dbPassword) {
        console.warn("⚠️  Warning: Database password not set in .env");
      }

      const listeningConnection = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        dbPassword,
        {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT || 5432,
          dialect: "postgres",
          logging: false,
        }
      );

      await listeningConnection.authenticate();

      const connection = await listeningConnection.connectionManager.getConnection();

      // Listen to new_message channel
      connection.query("LISTEN new_message", (err) => {
        if (err) {
          console.error("❌ Error listening to new_message:", err);
        }
      });

      // Handle notifications
      connection.on("notification", (msg) => {
        // Received notification from trigger

        if (msg.channel === "new_message") {
          this.handleNewMessage(msg.payload);
        }
      });      return listeningConnection;
    } catch (error) {
      console.error("❌ Error initializing trigger listener:", error.message);
      throw error;
    }
  }

  async handleNewMessage(payload) {
    try {
      const messageData = JSON.parse(payload);

      // Build full message object
      // Attempt to enrich payload with sender details for nicer client rendering
      let senderDetails = null;
      try {
        if (messageData.sender_id) {
          const cached = this.userCache.get(messageData.sender_id);
          const now = Date.now();
          if (cached && (now - cached._cachedAt) < 60000) {
            // Use cached value
            senderDetails = {
              id: cached.id,
              username: cached.username,
              display_name: cached.user_profile?.full_name || cached.username,
              avatar_url: cached.user_profile?.avatar_url || null,
            };
          } else {
            const sender = await db.User.findByPk(messageData.sender_id, {
              attributes: ['id', 'username'],
              include: [
                {
                  model: db.UserProfile,
                  as: 'user_profile',
                  attributes: ['full_name', 'avatar_url']
                }
              ]
            });
            if (sender) {
              senderDetails = {
                id: sender.id,
                username: sender.username,
                display_name: sender.user_profile?.full_name || sender.username,
                avatar_url: sender.user_profile?.avatar_url || null
              };
              // cache minimal representation
              this.userCache.set(sender.id, { id: sender.id, username: sender.username, user_profile: sender.user_profile, _cachedAt: Date.now() });
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ Unable to fetch sender details for trigger message', err?.message || err);
      }

      const messageObject = {
        id: messageData.id,
        content: messageData.content,
        text: messageData.content,
        media_url: messageData.media_url,
        sender_id: messageData.sender_id,
        receiver_id: messageData.receiver_id,
        conversation_id: messageData.conversation_id,
        created_at: messageData.created_at,
        timestamp: new Date(messageData.created_at),
        source: "trigger",
        from: senderDetails || null
      };

      // Broadcasting to conversation room

      // Emit to conversation room for instant delivery
      this.io.to(`conversation_${messageData.conversation_id}`).emit("receive:message", messageObject);

      // NOTE: we do not broadcast a duplicate 'new:message' event to avoid handlers emitting back

      // Notify recipient if private message
      if (messageData.receiver_id) {
        // Sending notification to recipient
        this.io.to(`user_${messageData.receiver_id}`).emit("notification:message", {
          type: "new_message",
          sender_id: messageData.sender_id,
          conversation_id: messageData.conversation_id,
          preview: messageData.content?.substring(0, 50) || "Message",
          received_at: new Date(),
          message: messageObject
        });
      }

      // Message delivered via trigger
    } catch (error) {
      console.error("❌ Error handling new message from trigger:", error.message, error);
    }
  }

  close() {
    console.log("🔌 Closing trigger listener");
  }
}

module.exports = TriggerListenerService;
