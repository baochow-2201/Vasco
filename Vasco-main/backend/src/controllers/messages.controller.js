// src/controllers/messages.controller.js
const { Message, Conversation, User, MessageMedia, UserProfile } = require("../models");

module.exports = {
  // create message
  create: async (req, res) => {
    try {
      const { conversation_id, sender_id, receiver_id = null, content, media_url = null } = req.body;

      // ensure conversation exists
      const conv = await Conversation.findByPk(conversation_id);
      if (!conv) return res.status(404).json({ message: "Conversation not found" });

      const msg = await Message.create({ conversation_id, sender_id, receiver_id, content, media_url });

      // attach any message media (optional: accepts body.media_ids = [..])
      if (req.body.media_ids && Array.isArray(req.body.media_ids) && req.body.media_ids.length) {
        const rows = req.body.media_ids.map((mid) => ({ message_id: msg.id, media_id: mid }));
        await MessageMedia.bulkCreate(rows);
      }

      // Fetch full message data with sender info
      const fullMessage = await Message.findByPk(msg.id, {
        include: [
          {
            model: User,
            as: "sender",
            attributes: ["id", "username"],
            include: [
              {
                model: UserProfile,
                as: "user_profile",
                attributes: ["full_name", "avatar_url"],
              },
            ],
          },
        ],
      });

      // if socket instance is mounted on app, emit event to clients
      try {
        const io = req.app && req.app.get && req.app.get("io");
        if (io) {
          io.to(`conversation_${conversation_id}`).emit("receive:message", { message: fullMessage });
          // also emit general channel
          io.emit("message:new", { message: fullMessage });
        }
      } catch (e) {
        // ignore
      }

      return res.status(201).json({ message: "Sent", data: fullMessage });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // get messages for conversation (with pagination)
  getByConversation: async (req, res) => {
    try {
      const conversation_id = req.params.conversationId || req.query.conversation_id;
      
      // If no conversation_id provided, return empty messages array
      if (!conversation_id) {
        return res.json({ messages: [] });
      }

      const limit = parseInt(req.query.limit || "50");
      const offset = parseInt(req.query.offset || "0");

      const msgs = await Message.findAll({
        where: { conversation_id },
        include: [{ model: User, as: "sender", attributes: ["id", "username"] }],
        order: [["created_at", "ASC"]],
        limit,
        offset,
      });

      return res.json({ messages: msgs });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // get single message
  getById: async (req, res) => {
    try {
      const msg = await Message.findByPk(req.params.id, {
        include: [{ model: User, as: "sender", attributes: ["id", "username"] }],
      });
      if (!msg) return res.status(404).json({ message: "Not found" });
      return res.json(msg);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // update message (e.g., edit)
  update: async (req, res) => {
    try {
      const msg = await Message.findByPk(req.params.id);
      if (!msg) return res.status(404).json({ message: "Not found" });
      await msg.update(req.body);
      return res.json({ message: "Updated", msg });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // delete message
  delete: async (req, res) => {
    try {
      const msg = await Message.findByPk(req.params.id);
      if (!msg) return res.status(404).json({ message: "Not found" });
      await msg.destroy();
      return res.json({ message: "Deleted" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Send public message (REST API)
  sendPublicMessage: async (req, res) => {
    try {
      const { text = "", media_url = null } = req.body;
      const sender_id = req.userId;

      console.log('📨 Sending public message via API:', { sender_id, text: text?.substring(0, 50), media_url: media_url ? 'has media' : 'no media' });

      const { Conversation, User, UserProfile } = require("../models");

      // Get or create public conversation
      let publicConversation = await Conversation.findOne({
        where: { is_group: true, name: "Public Chat" }
      });

      if (!publicConversation) {
        console.log("📝 Creating public chat conversation");
        publicConversation = await Conversation.create({
          is_group: true,
          name: "Public Chat",
          created_by: sender_id
        });
      }

      // Create message
      const message = await Message.create({
        conversation_id: publicConversation.id,
        sender_id,
        receiver_id: null,
        content: text,
        media_url
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

      // Emit via socket if available
      const io = req.app?.get?.("io");
      if (io) {
        io.emit("message", {
          id: fullMessage.id,
          text: fullMessage.content,
          content: fullMessage.content,
          media_url: fullMessage.media_url,
          sender_id: fullMessage.sender_id,
          from: {
            id: fullMessage.sender_id,
            username: fullMessage.sender?.username,
            display_name: fullMessage.sender?.user_profile?.full_name || fullMessage.sender?.username
          },
          created_at: fullMessage.created_at
        });
      }

      return res.status(201).json({ 
        message: "Message sent", 
        data: {
          id: fullMessage.id,
          text: fullMessage.content,
          media_url: fullMessage.media_url,
          sender_id: fullMessage.sender_id,
          from: {
            id: fullMessage.sender_id,
            username: fullMessage.sender?.username,
            display_name: fullMessage.sender?.user_profile?.full_name || fullMessage.sender?.username
          },
          created_at: fullMessage.created_at
        }
      });
    } catch (err) {
      console.error("❌ Error sending public message:", err.message, err.stack);
      return res.status(500).json({ error: err.message });
    }
  },

  // Get public chat messages
  getPublicMessages: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit || "50");
      const offset = parseInt(req.query.offset || "0");

      // Find public conversation
      const { Conversation } = require("../models");
      
      const publicConversation = await Conversation.findOne({
        where: { is_group: true, name: "Public Chat" }
      });

      // If no public conversation, return empty
      if (!publicConversation) {
        console.log("📭 No public conversation found, creating one");
        // Create the public conversation if it doesn't exist
        const newConversation = await Conversation.create({
          is_group: true,
          name: "Public Chat",
          created_by: 1
        });
        return res.json({ messages: [] });
      }

      console.log("🔍 Fetching messages from conversation:", publicConversation.id);

      const msgs = await Message.findAll({
        where: { conversation_id: publicConversation.id },
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
        ],
        order: [["created_at", "ASC"]],
        limit,
        offset
      });

      console.log("📨 Found", msgs.length, "messages");

      // Transform messages to match frontend expectations
      const formattedMessages = msgs.map(msg => ({
        id: msg.id,
        text: msg.content,
        content: msg.content,
        media_url: msg.media_url,
        sender_id: msg.sender_id,
        from: {
          id: msg.sender_id,
          username: msg.sender?.username,
          display_name: msg.sender?.user_profile?.full_name || msg.sender?.username
        },
        created_at: msg.created_at
      }));

      return res.json({ messages: formattedMessages });
    } catch (err) {
      console.error("❌ Error fetching public messages:", err.message, err.stack);
      return res.status(500).json({ error: err.message });
    }
  },
};
