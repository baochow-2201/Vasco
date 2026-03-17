// src/controllers/notifications.controller.js
const { Notification, User } = require("../models");

module.exports = {
  create: async (req, res) => {
    try {
      const n = await Notification.create(req.body);
      return res.status(201).json({ message: "Notification created", data: n });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const notifications = await Notification.findAll({
        include: User,
        order: [["created_at", "DESC"]],
      });
      return res.json(notifications);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getByUser: async (req, res) => {
    try {
      const list = await Notification.findAll({
        where: { user_id: req.params.userId },
        order: [["created_at", "DESC"]],
      });
      return res.json(list);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const n = await Notification.findByPk(req.params.id);
      if (!n) return res.status(404).json({ message: "Not found" });

      await n.update({ is_read: true });
      return res.json({ message: "Marked as read", data: n });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const n = await Notification.findByPk(req.params.id);
      if (!n) return res.status(404).json({ message: "Not found" });

      await n.destroy();
      return res.json({ message: "Deleted" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};
