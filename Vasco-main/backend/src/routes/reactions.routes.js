// src/routes/reactions.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reactions.controller');
const { verifyToken, attachUser } = require('../middleware/auth');

router.post('/', verifyToken, attachUser, ctrl.create);
router.get('/', verifyToken, attachUser, ctrl.getAll);
router.delete('/:id', verifyToken, attachUser, ctrl.delete);

module.exports = router;
