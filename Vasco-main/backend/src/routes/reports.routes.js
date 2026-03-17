// src/routes/reports.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reports.controller');
const { verifyToken, attachUser, isAdmin } = require('../middleware/auth');

router.post('/', verifyToken, attachUser, ctrl.create);

// admin can view all reports
router.get('/', verifyToken, isAdmin, ctrl.getAll);
router.get('/:id', verifyToken, isAdmin, ctrl.getById);
router.put('/:id', verifyToken, isAdmin, ctrl.update);
router.delete('/:id', verifyToken, isAdmin, ctrl.delete);

module.exports = router;
