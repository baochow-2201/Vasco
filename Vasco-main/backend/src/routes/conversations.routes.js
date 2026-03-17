// src/routes/conversations.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/conversations.controller');
const { verifyToken, attachUser } = require('../middleware/auth');

router.post('/', verifyToken, attachUser, ctrl.create);
router.get('/', verifyToken, attachUser, ctrl.getAll);
router.get('/:id', verifyToken, attachUser, ctrl.getById);
router.put('/:id', verifyToken, attachUser, ctrl.update);
router.delete('/:id', verifyToken, attachUser, ctrl.delete);

// participants helpers
router.post('/:id/participants', verifyToken, attachUser, ctrl.addParticipant);
router.delete('/:id/participants', verifyToken, attachUser, ctrl.removeParticipant);

module.exports = router;
