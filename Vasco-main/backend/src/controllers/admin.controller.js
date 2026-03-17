// src/controllers/admin.controller.js
const { User, Post, Report, AuditLog } = require("../models");

module.exports = {
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll({ order: [["created_at", "DESC"]] });
      return res.json(users);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  banUser: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      await user.update({ status: "banned" });

      await AuditLog.create({
        admin_id: req.adminId,
        action: "BAN_USER",
        target_id: user.id,
        target_type: "USER",
        description: `Admin banned user ${user.id}`,
      });

      return res.json({ message: "User banned", user });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  unbanUser: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      await user.update({ status: "active" });

      await AuditLog.create({
        admin_id: req.adminId,
        action: "UNBAN_USER",
        target_id: user.id,
        target_type: "USER",
        description: `Admin unbanned user ${user.id}`,
      });

      return res.json({ message: "User unbanned", user });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  deletePost: async (req, res) => {
    try {
      const post = await Post.findByPk(req.params.postId);
      if (!post) return res.status(404).json({ message: "Post not found" });

      await post.destroy();

      await AuditLog.create({
        admin_id: req.adminId,
        action: "DELETE_POST",
        target_id: post.id,
        target_type: "POST",
        description: `Admin removed post ${post.id}`,
      });

      return res.json({ message: "Post deleted" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  resolveReport: async (req, res) => {
    try {
      const report = await Report.findByPk(req.params.id);
      if (!report) return res.status(404).json({ message: "Report not found" });

      await report.update({ status: "resolved" });

      await AuditLog.create({
        admin_id: req.adminId,
        action: "RESOLVE_REPORT",
        target_id: report.id,
        target_type: "REPORT",
        description: `Admin resolved report ${report.id}`,
      });

      return res.json({ message: "Report resolved" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  dismissReport: async (req, res) => {
    try {
      const report = await Report.findByPk(req.params.id);
      if (!report) return res.status(404).json({ message: "Report not found" });

      await report.update({ status: "dismissed" });

      await AuditLog.create({
        admin_id: req.adminId,
        action: "DISMISS_REPORT",
        target_id: report.id,
        target_type: "REPORT",
        description: `Admin dismissed report ${report.id}`,
      });

      return res.json({ message: "Report dismissed" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  rejectPost: async (req, res) => {
    try {
      const post = await Post.findByPk(req.params.postId);
      if (!post) return res.status(404).json({ message: "Post not found" });

      await post.update({ is_hidden: true });

      await AuditLog.create({
        admin_id: req.adminId,
        action: "HIDE_POST",
        target_id: post.id,
        target_type: "POST",
        description: `Admin hid post ${post.id}`,
      });

      return res.json({ message: "Post hidden" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  rejectComment: async (req, res) => {
    try {
      const { Comment } = require("../models");
      const comment = await Comment.findByPk(req.params.commentId);
      if (!comment) return res.status(404).json({ message: "Comment not found" });

      await comment.update({ is_hidden: true });

      await AuditLog.create({
        admin_id: req.adminId,
        action: "HIDE_COMMENT",
        target_id: comment.id,
        target_type: "COMMENT",
        description: `Admin hid comment ${comment.id}`,
      });

      return res.json({ message: "Comment hidden" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};
