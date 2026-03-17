// src/routes/audit_logs.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/audit_logs.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.post('/', verifyToken, isAdmin, ctrl.create);
router.get('/', verifyToken, isAdmin, ctrl.getAll);
router.get('/:id', verifyToken, isAdmin, ctrl.getById);

module.exports = router;
