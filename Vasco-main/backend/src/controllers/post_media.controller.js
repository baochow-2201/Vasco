// src/controllers/post_media.controller.js
const { PostMedia, Post, Media } = require("../models");

module.exports = {
  create: async (req, res) => {
    try {
      // body: { post_id, media_id, order_index }
      const pm = await PostMedia.create(req.body);
      return res.status(201).json({ message: "Linked", post_media: pm });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const list = await PostMedia.findAll({
        include: [Post, Media],
        order: [["order_index", "ASC"]],
      });
      return res.json(list);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const pm = await PostMedia.findByPk(req.params.id, { include: [Post, Media] });
      if (!pm) return res.status(404).json({ message: "Not found" });
      return res.json(pm);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const pm = await PostMedia.findByPk(req.params.id);
      if (!pm) return res.status(404).json({ message: "Not found" });
      await pm.update(req.body);
      return res.json({ message: "Updated", pm });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const pm = await PostMedia.findByPk(req.params.id);
      if (!pm) return res.status(404).json({ message: "Not found" });
      await pm.destroy();
      return res.json({ message: "Deleted" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};
