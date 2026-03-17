const { Friendship, User, UserProfile } = require("../models");

module.exports = {
  create: async (req, res) => {
    try {
      const fs = await Friendship.create(req.body);
      res.json(fs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const data = await Friendship.findAll({
        include: [
          { model: User, as: "user1", include: [{ model: UserProfile, as: 'user_profile' }] },
          { model: User, as: "user2", include: [{ model: UserProfile, as: 'user_profile' }] },
        ],
      });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const fs = await Friendship.findByPk(req.params.id);
      if (!fs) return res.status(404).json({ message: "Not found" });
      await fs.destroy();
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
