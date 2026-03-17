// src/routes/posts.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/posts.controller');
const { verifyToken, attachUser, isAdmin } = require('../middleware/auth');
const upload = require('../utils/upload'); // multer instance

router.post('/', verifyToken, attachUser, upload.array('media', 6), ctrl.create);
router.get('/', verifyToken, attachUser, ctrl.getAll);
router.get('/:id', verifyToken, attachUser, ctrl.getById);
router.put('/:id', verifyToken, attachUser, ctrl.update);
router.delete('/:id', verifyToken, attachUser, ctrl.delete);
router.post('/:id/like', verifyToken, attachUser, ctrl.likePost);

// admin hide post
router.put('/:id/hide', verifyToken, isAdmin, ctrl.hidePost);

module.exports = router;
