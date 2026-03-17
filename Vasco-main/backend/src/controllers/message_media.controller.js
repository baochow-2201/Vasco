// src/controllers/message_media.controller.js
const { MessageMedia, Message, Media } = require("../models");

module.exports = {
  create: async (req, res) => {
    try {
      const mm = await MessageMedia.create(req.body);
      return res.status(201).json({ message: "Linked", data: mm });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const list = await MessageMedia.findAll({
        include: [Message, Media],
        order: [["created_at", "DESC"]],
      });
      return res.json(list);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const mm = await MessageMedia.findByPk(req.params.id, {
        include: [Message, Media],
      });
      if (!mm) return res.status(404).json({ message: "Not found" });

      return res.json(mm);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const mm = await MessageMedia.findByPk(req.params.id);
      if (!mm) return res.status(404).json({ message: "Not found" });

      await mm.destroy();
      return res.json({ message: "Deleted" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};
