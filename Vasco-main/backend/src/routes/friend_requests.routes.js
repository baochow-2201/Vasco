// src/routes/friend_requests.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/friend_requests.controller');
const { verifyToken, attachUser } = require('../middleware/auth');

router.post('/', verifyToken, attachUser, ctrl.create);
router.get('/', verifyToken, attachUser, ctrl.getAll);
router.put('/:id/accept', verifyToken, attachUser, ctrl.accept);
router.put('/:id/reject', verifyToken, attachUser, ctrl.reject);
router.put('/:id', verifyToken, attachUser, ctrl.update);
router.delete('/:id', verifyToken, attachUser, ctrl.delete);

module.exports = router;
