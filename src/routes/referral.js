const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const auth = require('../middleware/auth');
const apiLimiter = require('../middleware/rateLimiter');

// Genera un referral code (POST /api/referral/generate)
router.post('/generate', auth, apiLimiter, referralController.generate);

// Lista referral creati e usati (GET /api/referral/me)
router.get('/me', auth,apiLimiter, referralController.myReferrals);

module.exports = router;