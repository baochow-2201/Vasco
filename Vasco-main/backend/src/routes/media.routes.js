// src/routes/media.routes.js
const express = require('express');
const router = express.Router();
const mediaCtrl = require('../controllers/media.controller');
const { verifyToken, attachUser } = require('../middleware/auth');

// use multer middleware provided by controller
router.post('/upload', verifyToken, attachUser, mediaCtrl.upload.single('file'), mediaCtrl.uploadHandler);
router.get('/', verifyToken, attachUser, mediaCtrl.getAll);
router.get('/:id', verifyToken, attachUser, mediaCtrl.getById);
router.put('/:id', verifyToken, attachUser, mediaCtrl.update);
router.delete('/:id', verifyToken, attachUser, mediaCtrl.delete);

module.exports = router;
