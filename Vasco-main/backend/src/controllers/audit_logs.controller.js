// src/controllers/audit_logs.controller.js
const { AuditLog, User } = require("../models");

module.exports = {
  create: async (req, res) => {
    try {
      const log = await AuditLog.create(req.body);
      return res.status(201).json({ message: "Log created", data: log });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const logs = await AuditLog.findAll({
        include: [{ model: User, as: "admin" }],
        order: [["created_at", "DESC"]],
      });
      return res.json(logs);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const log = await AuditLog.findByPk(req.params.id, {
        include: [{ model: User, as: "admin" }],
      });
      if (!log) return res.status(404).json({ message: "Not found" });
      return res.json(log);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};
