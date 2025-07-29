const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Info utente loggato (inclusi profilo e referral)
router.get('/me', auth, userController.me);

module.exports = router;