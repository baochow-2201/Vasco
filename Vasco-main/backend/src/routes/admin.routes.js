// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/admin.controller');
const { verifyToken, isAdmin, attachUser } = require('../middleware/auth');

router.use(verifyToken, isAdmin, attachUser);

router.get('/users', adminCtrl.getAllUsers);
router.put('/user/:userId/ban', adminCtrl.banUser);
router.put('/user/:userId/unban', adminCtrl.unbanUser);
router.delete('/post/:postId', adminCtrl.deletePost);
router.put('/post/:postId/reject', adminCtrl.rejectPost);
router.put('/comment/:commentId/reject', adminCtrl.rejectComment);
router.put('/report/:id/resolve', adminCtrl.resolveReport);
router.put('/report/:id/dismiss', adminCtrl.dismissReport);

module.exports = router;
