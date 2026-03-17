// src/controllers/conversations.controller.js
const { Conversation, ConversationParticipant, User, Message, UserProfile } = require("../models");

module.exports = {
  // create conversation (body: { name?, is_group, participants: [userIds] })
  create: async (req, res) => {
    try {
      const { name, is_group = false, participants = [] } = req.body;
      const conv = await Conversation.create({ name: name || null, is_group: !!is_group });

      if (Array.isArray(participants) && participants.length) {
        const rows = participants.map((uid) => ({ conversation_id: conv.id, user_id: uid }));
        await ConversationParticipant.bulkCreate(rows);
      }

      const convWithParts = await Conversation.findByPk(conv.id, { include: [{ model: User }] });
      return res.status(201).json({ message: "Conversation created", conversation: convWithParts });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // get all conversations (for current user)
  getAll: async (req, res) => {
    try {
      const currentUserId = req.userId;
      console.log(`🔍 [/api/conversations] Fetching conversations for user ${currentUserId}`);
      
      // Find all conversation IDs where current user is a participant
      const participantRecords = await ConversationParticipant.findAll({
        where: { user_id: currentUserId },
        attributes: ['conversation_id'],
      });
      
      const conversationIds = participantRecords.map(r => r.conversation_id);
      console.log(`  📍 User ${currentUserId} is in conversations: ${conversationIds.join(',') || 'NONE'}`);
      
      if (conversationIds.length === 0) {
        console.log(`  ⚠️  No conversations found for user ${currentUserId}`);
        return res.json([]);
      }
      
      // Fetch conversations with all participants and messages
      const conversations = await Conversation.findAll({
        where: {
          id: conversationIds
        },
        include: [
          {
            model: Message,
            attributes: ['id', 'content', 'media_url', 'sender_id', 'receiver_id', 'created_at'],
            order: [['created_at', 'DESC']],
            limit: 1,
            separate: true
          }
        ],
        order: [['updated_at', 'DESC']],
      });
      
      // Fetch participants separately for each conversation
      for (const conv of conversations) {
        const participants = await ConversationParticipant.findAll({
          where: { conversation_id: conv.id },
          attributes: ['user_id', 'conversation_id'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email'],
              include: [
                {
                  model: UserProfile,
                  as: 'user_profile',
                  attributes: ['full_name', 'avatar_url']
                }
              ]
            }
          ]
        });
        
        console.log(`    Conversation ${conv.id}: ${participants.length} participants - [${participants.map(p => p.user?.username || '?').join(', ')}]`);
        conv.dataValues.conversation_participants = participants;
      }
      
      console.log(`  ✅ Found ${conversations.length} conversations`);
      
      // Transform response to include Users from participants
      const transformedConversations = conversations.map(conv => {
        const participants = conv.dataValues.conversation_participants || [];
        const users = participants
          .map(cp => {
            if (!cp.user) return null;
            return {
              id: cp.user.id,
              username: cp.user.username,
              email: cp.user.email,
              user_profile: cp.user.user_profile
            };
          })
          .filter(Boolean);
        
        console.log(`    Conversation ${conv.id}: ${users.length} participants - [${users.map(u => u.username).join(', ')}]`);
        
        const convJson = conv.toJSON();
        return {
          ...convJson,
          Users: users,
        };
      });
      
      return res.json(transformedConversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // get conversation by id with participants and recent messages
  getById: async (req, res) => {
    try {
      const conv = await Conversation.findByPk(req.params.id, {
        include: [
          { model: User },
          { model: Message, include: [{ model: User, as: "sender", attributes: ["id", "username"] }], order: [["created_at", "ASC"]] },
        ],
      });
      if (!conv) return res.status(404).json({ message: "Conversation not found" });
      return res.json(conv);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // update conversation metadata
  update: async (req, res) => {
    try {
      const conv = await Conversation.findByPk(req.params.id);
      if (!conv) return res.status(404).json({ message: "Conversation not found" });
      await conv.update(req.body);
      return res.json({ message: "Updated", conversation: conv });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // delete conversation + participants + messages
  delete: async (req, res) => {
    try {
      const conv = await Conversation.findByPk(req.params.id);
      if (!conv) return res.status(404).json({ message: "Conversation not found" });
      await conv.destroy();
      return res.json({ message: "Conversation deleted" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // helper to add a participant (POST /conversations/:id/participants)
  addParticipant: async (req, res) => {
    try {
      const conv = await Conversation.findByPk(req.params.id);
      if (!conv) return res.status(404).json({ message: "Conversation not found" });
      const { user_id } = req.body;
      const exists = await ConversationParticipant.findOne({ where: { conversation_id: conv.id, user_id } });
      if (exists) return res.status(400).json({ message: "Already participant" });
      const cp = await ConversationParticipant.create({ conversation_id: conv.id, user_id });
      return res.status(201).json({ message: "Added", participant: cp });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // helper to remove participant
  removeParticipant: async (req, res) => {
    try {
      const conv = await Conversation.findByPk(req.params.id);
      if (!conv) return res.status(404).json({ message: "Conversation not found" });
      const { user_id } = req.body;
      const cp = await ConversationParticipant.findOne({ where: { conversation_id: conv.id, user_id } });
      if (!cp) return res.status(404).json({ message: "Participant not found" });
      await cp.destroy();
      return res.json({ message: "Removed" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};
