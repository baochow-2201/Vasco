// src/routes/messages.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/messages.controller');
const { verifyToken, attachUser } = require('../middleware/auth');

router.post('/', verifyToken, attachUser, ctrl.create);
router.post('/public/send', verifyToken, attachUser, ctrl.sendPublicMessage);
router.get('/public/chat', verifyToken, attachUser, ctrl.getPublicMessages);
router.get('/conversation/:conversationId', verifyToken, attachUser, ctrl.getByConversation);
router.get('/:id', verifyToken, attachUser, ctrl.getById);
router.put('/:id', verifyToken, attachUser, ctrl.update);
router.delete('/:id', verifyToken, attachUser, ctrl.delete);
router.get('/', verifyToken, attachUser, ctrl.getByConversation);

module.exports = router;
