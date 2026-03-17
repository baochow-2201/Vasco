const { User, UserProfile } = require("../models");

module.exports = {
  // CREATE USER
  create: async (req, res) => {
    try {
      const { email, username, password, role } = req.body;

      const user = await User.create({
        email,
        username,
        password,
        role
      });

      return res.json({ message: "User created", user });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // GET ALL USERS
  getAll: async (req, res) => {
    try {
      const users = await User.findAll({
        include: [{ model: UserProfile, as: 'user_profile' }]
      });

      return res.json(users);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // GET USER BY ID
  getById: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id, {
        include: [{ model: UserProfile, as: 'user_profile' }]
      });

      if (!user) return res.status(404).json({ message: "User not found" });

      return res.json(user);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // UPDATE USER
  update: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      await user.update(req.body);

      return res.json({ message: "User updated", user });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // DELETE USER
  delete: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      await user.destroy();

      return res.json({ message: "User deleted" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // UPDATE USER ACTIVITY STATUS
  updateActivity: async (req, res) => {
    try {
      const userId = req.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await user.update({ 
        last_active: new Date(),
        status: 'active'
      });

      return res.json({ 
        message: "Activity updated", 
        user: {
          id: user.id,
          username: user.username,
          status: user.status,
          last_active: user.last_active
        }
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};
