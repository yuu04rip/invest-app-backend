const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
    registerValidator,
    loginValidator,
    otpValidator,
    resendOtpValidator
} = require('../middleware/authValidators');
const validate = require('../middleware/validate');
const apiLimiter = require('../middleware/rateLimiter');

router.post('/register', registerValidator, validate, authController.register);
router.post('/login', apiLimiter, loginValidator, validate, authController.login);
router.post('/verify-otp', apiLimiter, otpValidator, validate, authController.verifyOtp);
router.post('/resend-otp', resendOtpValidator, validate, authController.resendOtp);

module.exports = router;