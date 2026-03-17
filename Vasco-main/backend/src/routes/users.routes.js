// src/routes/users.routes.js
const express = require('express');
const router = express.Router();
const usersCtrl = require('../controllers/users.controller');
const { verifyToken, isAdmin, attachUser } = require('../middleware/auth');

router.post('/', usersCtrl.create); // create user (admin or public registration route)
router.get('/list/all', verifyToken, attachUser, usersCtrl.getAll); // authenticated users can see all users (for friend suggestions)
router.get('/', verifyToken, isAdmin, usersCtrl.getAll); // admin only
router.get('/:id', verifyToken, attachUser, usersCtrl.getById);
router.put('/activity/update', verifyToken, attachUser, usersCtrl.updateActivity); // update activity status
router.put('/:id', verifyToken, attachUser, usersCtrl.update);
router.delete('/:id', verifyToken, isAdmin, usersCtrl.delete);

module.exports = router;
