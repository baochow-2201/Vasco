// src/controllers/private-messages.controller.js
const { Message, Conversation, ConversationParticipant, User, UserProfile } = require("../models");
const { Op } = require("sequelize");

module.exports = {
  // Send private message (creates/finds conversation and saves message)
  send: async (req, res) => {
    try {
      const { receiver_id, text = "", media_url = null } = req.body;
      const sender_id = req.userId;

      console.log('📨 Send message request:', { sender_id, receiver_id, text: text?.substring(0, 50), media_url: media_url ? 'has media' : 'no media' });

      if (!receiver_id) {
        return res.status(400).json({ error: "receiver_id is required" });
      }

      // Find or create conversation between sender and receiver
      let conversation = await Conversation.findOne({
        where: {
          is_group: false,
        },
        include: [
          {
            association: 'conversation_participants',
            attributes: ['user_id'],
            where: {
              user_id: {
                [Op.in]: [sender_id, receiver_id],
              },
            },
          },
        ],
      });

      // If conversation exists, verify both users are in it
      if (conversation) {
        const participantIds = conversation.conversation_participants.map((p) => p.user_id);
        if (
          participantIds.length !== 2 ||
          !participantIds.includes(sender_id) ||
          !participantIds.includes(receiver_id)
        ) {
          conversation = null;
        }
      }

      // Create conversation if it doesn't exist
      if (!conversation) {
        conversation = await Conversation.create({
          is_group: false,
          created_by: sender_id,
        });

        // Add both participants
        await ConversationParticipant.create({
          conversation_id: conversation.id,
          user_id: sender_id,
        });
        await ConversationParticipant.create({
          conversation_id: conversation.id,
          user_id: receiver_id,
        });
      }

      // Create message
      const message = await Message.create({
        conversation_id: conversation.id,
        sender_id,
        receiver_id,
        content: text,
        media_url,
      });
      console.log(`📦 Message saved -> id: ${message.id}, conversation_id: ${conversation.id}`);

      // Fetch full message data with sender info
      const messageData = await Message.findByPk(message.id, {
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
          {
            model: User,
            as: "receiver",
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

      // Transform message to include 'from' field for frontend compatibility
      const transformedMessage = {
        ...messageData.toJSON(),
        from: {
          id: messageData.sender.id,
          username: messageData.sender.username,
          display_name: messageData.sender.user_profile?.full_name || messageData.sender.username,
          avatar_url: messageData.sender.user_profile?.avatar_url || messageData.sender?.avatar_url || null,
        },
        text: messageData.content,
      };

      // Emit socket event if available
      try {
        const io = req.app && req.app.get && req.app.get("io");
        if (io) {
          io.to(`conversation_${conversation.id}`).emit("receive:message", {
            message: transformedMessage,
          });
        }
      } catch (e) {
        // ignore socket errors
      }

      return res.status(201).json({
        message: "Message sent",
        data: transformedMessage,
        conversation_id: conversation.id,
      });
    } catch (err) {
      console.error("❌ Error sending private message:", err.message);
      return res.status(500).json({ error: err.message });
    }
  },

  // Get private messages with a friend
  getWithFriend: async (req, res) => {
    try {
      const friendId = parseInt(req.params.friendId, 10); // Convert to number
      const currentUserId = req.userId;
      console.log(`🔍 Fetching messages between user ${currentUserId} and friend ${friendId}`);

      // Try to find a private conversation between the two users
      // Use fallback query first since include with where can be unreliable
      console.log(`🔍 Searching for conversation between user ${currentUserId} and ${friendId}`);
      
      const participantRecords = await ConversationParticipant.findAll({
        attributes: ['conversation_id', 'user_id'],
        where: { user_id: { [Op.in]: [currentUserId, friendId] } },
      });
      
      console.log(`🔎 Found ${participantRecords.length} participant records`);
      
      // Build map conversation_id -> set of user IDs
      const convMap = {};
      for (const r of participantRecords) {
        const cid = r.conversation_id;
        if (!convMap[cid]) convMap[cid] = new Set();
        convMap[cid].add(r.user_id);
      }
      
      console.log(`🔎 Conversation map has ${Object.keys(convMap).length} unique conversations`);
      
      // Find conversation with BOTH users
      let conversationId = null;
      for (const [cid, userSet] of Object.entries(convMap)) {
        console.log(`  🔎 Checking conversation ${cid}: size=${userSet.size}, users=[${Array.from(userSet).join(',')}]`);
        if (userSet.size >= 2 && userSet.has(currentUserId) && userSet.has(friendId)) {
          conversationId = cid;
          console.log(`✅ Found matching conversation: ${cid} with users [${Array.from(userSet).join(',')}]`);
          break;
        }
      }
      
      let conversation = null;
      if (conversationId) {
        conversation = await Conversation.findByPk(conversationId, {
          include: [
            { association: 'conversation_participants', attributes: ['user_id'] },
          ],
        });
      }

      if (!conversation) {
        console.log(`❌ No conversation found between ${currentUserId} and ${friendId}`);
        return res.json({
          messages: [],
          conversation_id: null,
        });
      }

      // Verify both users are in conversation
      const participantIds = conversation.conversation_participants.map((p) => p.user_id);
      console.log(`✅ Found conversation ${conversation.id} with participants: ${participantIds.join(',')}`);
      if (
        participantIds.length !== 2 ||
        !participantIds.includes(currentUserId) ||
        !participantIds.includes(friendId)
      ) {
        console.log(`❌ Verification failed: length=${participantIds.length}, has current=${participantIds.includes(currentUserId)}, has friend=${participantIds.includes(friendId)}`);
        return res.json({
          messages: [],
          conversation_id: null,
        });
      }

      // Get messages
      const messages = await Message.findAll({
        where: { conversation_id: conversation.id },
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
          {
            model: User,
            as: "receiver",
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
        order: [["created_at", "ASC"]],
      });

      console.log(`📤 Returning ${messages.length} private messages for conversation ${conversation.id}`);
      // Transform messages to include 'from' and 'text' fields for frontend compatibility
      const transformedMessages = messages.map((msg) => ({
        ...msg.toJSON(),
        from: {
          id: msg.sender.id,
          username: msg.sender.username,
          display_name: msg.sender.user_profile?.full_name || msg.sender.username,
          avatar_url: msg.sender.user_profile?.avatar_url || msg.sender?.avatar_url || null,
        },
        text: msg.content,
      }));

      return res.json({
        messages: transformedMessages,
        conversation_id: conversation.id,
      });
    } catch (err) {
      console.error("Error fetching private messages:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  // Delete private message
  delete: async (req, res) => {
    try {
      const messageId = req.params.id;
      const currentUserId = req.userId;

      const message = await Message.findByPk(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Check if current user is sender
      if (message.sender_id !== currentUserId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await message.destroy();
      return res.json({ message: "Message deleted" });
    } catch (err) {
      console.error("Error deleting private message:", err);
      return res.status(500).json({ error: err.message });
    }
  },
};
