const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const auth = require('../middleware/auth');
const apiLimiter = require('../middleware/rateLimiter');

// CREA un referral
router.post('/generate', apiLimiter, auth, referralController.generate);

// Lista referral creati e usati (GET /api/referral/me)
router.get('/me', apiLimiter, auth, referralController.myReferrals);

module.exports = router;