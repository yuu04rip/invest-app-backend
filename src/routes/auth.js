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

router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);
router.post('/verify-otp', otpValidator, validate, authController.verifyOtp);
router.post('/resend-otp', resendOtpValidator, validate, authController.resendOtp);

module.exports = router;