// src/routes/index.js
const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./users.routes'));
router.use('/user-profiles', require('./user_profiles.routes'));
router.use('/profiles', require('./user_profiles.routes'));
router.use('/friend-requests', require('./friend_requests.routes'));
router.use('/friendships', require('./friendships.routes'));
router.use('/posts', require('./posts.routes'));
router.use('/comments', require('./comments.routes'));
router.use('/reactions', require('./reactions.routes'));
router.use('/reports', require('./reports.routes'));
router.use('/media', require('./media.routes'));
router.use('/post-media', require('./post_media.routes'));
router.use('/conversations', require('./conversations.routes'));
router.use('/participants', require('./conversation_participants.routes'));
router.use('/messages', require('./messages.routes'));
router.use('/private-messages', require('./private-messages.routes'));
router.use('/message-media', require('./message_media.routes'));
router.use('/notifications', require('./notifications.routes'));
router.use('/audit-logs', require('./audit_logs.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/upload', require('./upload.routes'));

module.exports = router;
