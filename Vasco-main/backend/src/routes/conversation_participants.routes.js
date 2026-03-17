// src/routes/conversation_participants.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/conversation_participants.controller');
const { verifyToken, attachUser } = require('../middleware/auth');

router.post('/', verifyToken, attachUser, ctrl.create);
router.get('/', verifyToken, attachUser, ctrl.getAll);
router.get('/:id', verifyToken, attachUser, ctrl.getById);
router.delete('/:id', verifyToken, attachUser, ctrl.delete);

module.exports = router;
