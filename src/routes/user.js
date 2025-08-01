const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const apiLimiter = require('../middleware/rateLimiter');

// Info utente loggato (inclusi profilo e referral)
router.get('/me', apiLimiter, auth, userController.me);

module.exports = router;