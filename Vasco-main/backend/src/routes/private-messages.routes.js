// src/routes/private-messages.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/private-messages.controller');
const { verifyToken, attachUser } = require('../middleware/auth');

// Send private message (creates/finds conversation)
router.post('/', verifyToken, attachUser, ctrl.send);

// Get messages with a friend
router.get('/:friendId', verifyToken, attachUser, ctrl.getWithFriend);

// Delete private message
router.delete('/:id', verifyToken, attachUser, ctrl.delete);

module.exports = router;
