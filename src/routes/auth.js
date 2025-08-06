const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
    registerValidator,
    loginValidator,
    otpValidator,
    resendOtpValidator,
    changePasswordValidator,
    requestPasswordResetValidator,
    verifyResetOtpValidator,
    resetPasswordValidator
} = require('../middleware/authValidators');
const validate = require('../middleware/validate');
const apiLimiter = require('../middleware/rateLimiter');
const authenticate = require('../middleware/auth'); // <-- AGGIUNGI QUESTA RIGA!

router.post('/register', registerValidator, validate, authController.register);
router.post('/login', apiLimiter, loginValidator, validate, authController.login);
router.post('/verify-otp', apiLimiter, otpValidator, validate, authController.verifyOtp);
router.post('/resend-otp', resendOtpValidator, validate, authController.resendOtp);
router.post('/change-password', authenticate, changePasswordValidator, validate, authController.changePassword);
router.post('/request-password-reset', requestPasswordResetValidator, validate, authController.requestPasswordReset);
router.post('/verify-reset-otp', verifyResetOtpValidator, validate, authController.verifyResetOtp);
router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword);

module.exports = router;