// src/routes/notifications.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notifications.controller');
const { verifyToken, attachUser } = require('../middleware/auth');

router.post('/', verifyToken, attachUser, ctrl.create);
router.get('/', verifyToken, attachUser, ctrl.getAll);
router.get('/user/:userId', verifyToken, attachUser, ctrl.getByUser);
router.put('/:id/read', verifyToken, attachUser, ctrl.markAsRead);
router.delete('/:id', verifyToken, attachUser, ctrl.delete);

module.exports = router;
