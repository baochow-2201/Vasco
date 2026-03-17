const { UserProfile, User } = require("../models");

module.exports = {
  create: async (req, res) => {
    try {
      const profile = await UserProfile.create(req.body);
      res.json(profile);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const data = await UserProfile.findAll({ include: User });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const data = await UserProfile.findByPk(req.params.id, { include: User });
      if (!data) return res.status(404).json({ message: "Not found" });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getByUserId: async (req, res) => {
    try {
      const userId = req.params.userId;
      const data = await UserProfile.findOne({ 
        where: { user_id: userId },
        include: User 
      });
      if (!data) return res.status(404).json({ message: "Not found" });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      let data = await UserProfile.findByPk(req.params.id);
      
      if (!data) return res.status(404).json({ message: "Not found" });

      await data.update(req.body);
      res.json({ message: "Updated", data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  updateByUserId: async (req, res) => {
    try {
      const userId = req.params.userId;
      let data = await UserProfile.findOne({ where: { user_id: userId } });
      
      // If not found, create new profile
      if (!data) {
        data = await UserProfile.create({
          user_id: userId,
          ...req.body
        });
        return res.json({ message: "Created", data });
      }

      await data.update(req.body);
      res.json({ message: "Updated", data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const data = await UserProfile.findByPk(req.params.id);
      if (!data) return res.status(404).json({ message: "Not found" });
      await data.destroy();
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
