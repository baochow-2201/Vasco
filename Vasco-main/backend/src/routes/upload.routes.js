// src/routes/upload.routes.js
const express = require('express');
const router = express.Router();
const uploadCtrl = require('../controllers/upload.controller');
const { verifyToken, attachUser } = require('../middleware/auth');

// Upload avatar (base64 to Cloudinary)
router.post('/avatar', verifyToken, attachUser, uploadCtrl.uploadAvatar);

// Upload cover (base64 to Cloudinary)
router.post('/cover', verifyToken, attachUser, uploadCtrl.uploadCover);

// Upload post image (base64 to Cloudinary)
router.post('/post', verifyToken, attachUser, uploadCtrl.uploadPost);

// Upload message image (base64 to Cloudinary)
router.post('/message', verifyToken, attachUser, uploadCtrl.uploadMessage);

module.exports = router;
