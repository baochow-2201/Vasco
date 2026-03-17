const { Reaction, User, Post, Comment } = require("../models");

module.exports = {
  create: async (req, res) => {
    try {
      const r = await Reaction.create(req.body);
      res.json(r);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const { post_id, comment_id } = req.query;
      
      const where = {};
      if (post_id) where.post_id = post_id;
      if (comment_id) where.comment_id = comment_id;
      
      const data = await Reaction.findAll({
        where: where.post_id || where.comment_id ? where : {},
        include: [User, Post, Comment],
      });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const r = await Reaction.findByPk(req.params.id);
      if (!r) return res.status(404).json({ message: "Not found" });
      await r.destroy();
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
