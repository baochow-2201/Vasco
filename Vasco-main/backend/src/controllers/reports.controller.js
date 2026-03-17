// src/controllers/reports.controller.js
const { Report, User, Post, Comment, Notification } = require("../models");

module.exports = {
  // Create a report
  create: async (req, res) => {
    try {
      const { type, targetId, reason } = req.body;
      const reporter_id = req.user?.id;
      
      if (!reporter_id || !type || !targetId || !reason) {
        return res.status(400).json({ error: 'Missing required fields: type, targetId, reason' });
      }

      let post_id = null;
      let comment_id = null;
      let reported_user_id = null;
      let targetContent = '';

      // Get reported user based on post/comment
      if (type === 'post') {
        post_id = targetId;
        const post = await Post.findByPk(post_id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        reported_user_id = post.user_id;
        targetContent = post.content || '';
      } else if (type === 'comment') {
        comment_id = targetId;
        const comment = await Comment.findByPk(comment_id);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        reported_user_id = comment.user_id;
        post_id = comment.post_id; // Also store post_id for context
        targetContent = comment.content || '';
      }

      const report = await Report.create({ 
        reporter_id, 
        post_id, 
        comment_id,
        reported_user_id, 
        reason,
        type,
        status: 'pending'
      });
      
      // Notify all admins about the new report
      try {
        const admins = await User.findAll({ where: { role: 'admin' } });
        const reporterInfo = await User.findByPk(reporter_id);
        const reporterName = reporterInfo?.full_name || reporterInfo?.username || 'Unknown user';
        
        const notificationMessage = `Báo cáo mới: ${reporterName} báo cáo ${type === 'post' ? 'bài viết' : 'bình luận'} - "${targetContent.substring(0, 50)}..."`;
        
        for (const admin of admins) {
          await Notification.create({
            user_id: admin.id,
            type: 'report',
            message: notificationMessage,
            source_id: report.id,
            source_type: 'report',
            is_read: false
          });
        }
        console.log(`✅ Notified ${admins.length} admins about new report #${report.id}`);
      } catch (notifErr) {
        console.error('⚠️  Error sending admin notifications:', notifErr.message);
        // Don't fail the report creation if notification fails
      }
      
      return res.status(201).json({ id: report.id, message: "Report created successfully and admin notified", report });
    } catch (err) {
      console.error('Error creating report:', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // Get all reports (with relations)
  getAll: async (req, res) => {
    try {
      const reports = await Report.findAll({
        include: [
          { model: User, as: "reporter", attributes: ["id", "username", "email"] },
          { model: User, as: "reported_user", attributes: ["id", "username", "email"] },
          { model: Post, attributes: ["id", "content"] },
          { model: Comment, attributes: ["id", "content"] },
        ],
        order: [["created_at", "DESC"]],
      });
      return res.json(reports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // Get single report
  getById: async (req, res) => {
    try {
      const report = await Report.findByPk(req.params.id, {
        include: [
          { model: User, as: "reporter", attributes: ["id", "username"] },
          { model: User, as: "reported_user", attributes: ["id", "username"] },
          { model: Post, attributes: ["id", "content"] },
          { model: Comment, attributes: ["id", "content"] },
        ],
      });
      if (!report) return res.status(404).json({ message: "Report not found" });
      return res.json(report);
    } catch (err) {
      console.error('Error fetching report:', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // Update report (e.g., status or reason)
  update: async (req, res) => {
    try {
      const report = await Report.findByPk(req.params.id);
      if (!report) return res.status(404).json({ message: "Report not found" });
      await report.update(req.body);
      return res.json({ message: "Report updated", report });
    } catch (err) {
      console.error('Error updating report:', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // Delete report
  delete: async (req, res) => {
    try {
      const report = await Report.findByPk(req.params.id);
      if (!report) return res.status(404).json({ message: "Report not found" });
      await report.destroy();
      return res.json({ message: "Report deleted" });
    } catch (err) {
      console.error('Error deleting report:', err);
      return res.status(500).json({ error: err.message });
    }
  },
};
