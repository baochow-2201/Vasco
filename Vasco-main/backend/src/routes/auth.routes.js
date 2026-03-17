// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');
const { verifyToken, attachUser } = require('../middleware/auth');

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.post('/google', authCtrl.google);
router.post('/logout', verifyToken, attachUser, authCtrl.logout);
router.get('/me', verifyToken, attachUser, authCtrl.me);
router.put('/change-password', verifyToken, attachUser, authCtrl.changePassword);

module.exports = router;
