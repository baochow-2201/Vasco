// src/routes/user_profiles.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/user_profiles.controller');
const { verifyToken, attachUser } = require('../middleware/auth');

router.post('/', ctrl.create);
router.get('/', verifyToken, attachUser, ctrl.getAll);
router.get('/user/:userId', verifyToken, attachUser, ctrl.getByUserId);
router.put('/user/:userId', verifyToken, attachUser, ctrl.updateByUserId);
router.get('/:id', verifyToken, attachUser, ctrl.getById);
router.put('/:id', verifyToken, attachUser, ctrl.update);
router.delete('/:id', verifyToken, attachUser, ctrl.delete);

module.exports = router;
