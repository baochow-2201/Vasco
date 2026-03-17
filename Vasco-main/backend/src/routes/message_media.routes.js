// src/routes/message_media.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/message_media.controller');
const { verifyToken, attachUser } = require('../middleware/auth');

router.post('/', verifyToken, attachUser, ctrl.create);
router.get('/', verifyToken, attachUser, ctrl.getAll);
router.get('/:id', verifyToken, attachUser, ctrl.getById);
router.delete('/:id', verifyToken, attachUser, ctrl.delete);

module.exports = router;
