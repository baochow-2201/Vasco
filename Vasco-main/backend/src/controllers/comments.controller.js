const { Comment, User, Post, UserProfile } = require("../models");

module.exports = {
  create: async (req, res) => {
    try {
      // Ensure user_id is taken from the authenticated token, not the client
      const user_id = req.userId || (req.user && req.user.id);
      const { post_id, content } = req.body;

      if (!post_id) return res.status(400).json({ message: 'post_id is required' });
      if (!content || !content.trim()) return res.status(400).json({ message: 'content is required' });

      const c = await Comment.create({ post_id, user_id, content });
      const created = await Comment.findByPk(c.id, { include: [{ model: User, as: 'user', include: [{ model: UserProfile, as: 'user_profile' }] }, Post] });

      // Emit to socket so all clients can show new comment, if realtime enabled
      try {
        const io = req.app.get('io');
        const realtimeEnabled = req.app.get('realtimeEnabled') !== false;
        if (io && realtimeEnabled) io.emit('new_comment', { comment: created });
      } catch (e) { /* ignore errors when emitting */ }

      res.json({ comment: created });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const where = { is_hidden: false };
      if (req.query.post_id) where.post_id = req.query.post_id;
      const data = await Comment.findAll({
        where,
        include: [{ model: User, as: 'user', include: [{ model: UserProfile, as: 'user_profile' }] }, Post],
        order: [['created_at', 'ASC']],
      });
      res.json({ comments: data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const c = await Comment.findByPk(req.params.id);
      if (!c) return res.status(404).json({ message: "Not found" });

      await c.update(req.body);
      res.json({ message: "Updated", c });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const c = await Comment.findByPk(req.params.id);
      if (!c) return res.status(404).json({ message: "Not found" });

      await c.destroy();
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
