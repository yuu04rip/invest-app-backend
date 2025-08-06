const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const apiLimiter = require('../middleware/rateLimiter');

// Info utente loggato (inclusi profilo e referral)
router.get('/me', apiLimiter, auth, userController.me);

// Controllo disponibilità username
router.get('/check-username', apiLimiter, userController.checkUsername);

// Aggiorna username e/o foto profilo
router.patch('/me', apiLimiter, auth, userController.updateMe);

module.exports = router;;