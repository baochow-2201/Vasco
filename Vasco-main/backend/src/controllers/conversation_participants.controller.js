// src/controllers/conversation_participants.controller.js
const { ConversationParticipant, Conversation, User } = require("../models");

module.exports = {
  create: async (req, res) => {
    try {
      const cp = await ConversationParticipant.create(req.body);
      return res.status(201).json(cp);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const list = await ConversationParticipant.findAll({
        include: [{ model: Conversation }, { model: User }],
        order: [["created_at", "DESC"]],
      });
      return res.json(list);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const cp = await ConversationParticipant.findByPk(req.params.id, { include: [Conversation, User] });
      if (!cp) return res.status(404).json({ message: "Not found" });
      return res.json(cp);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const cp = await ConversationParticipant.findByPk(req.params.id);
      if (!cp) return res.status(404).json({ message: "Not found" });
      await cp.destroy();
      return res.json({ message: "Deleted" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};
