const { body } = require('express-validator');

// Validazione per la registrazione
const registerValidator = [
    body('email').isEmail().withMessage('Email non valida'),
    body('password').isLength({ min: 8 }).withMessage('La password deve avere almeno 8 caratteri'),
    body('role').isIn(['imprenditore', 'investitore', 'admin']).withMessage('Ruolo non valido'),
    body('referralCode').optional().isString()
];

// Validazione per il login
const loginValidator = [
    body('email').isEmail().withMessage('Email non valida'),
    body('password').notEmpty().withMessage('Password obbligatoria')
];

// Validazione per la verifica OTP
const otpValidator = [
    body('email').isEmail().withMessage('Email non valida'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP non valido')
];

// Validazione per il reinvio OTP (solo email)
const resendOtpValidator = [
    body('email').isEmail().withMessage('Email non valida')
];

// Cambio password autenticato
const changePasswordValidator = [
    body('oldPassword').isLength({ min: 8 }).withMessage('La password attuale deve avere almeno 8 caratteri'),
    body('newPassword').isLength({ min: 8 }).withMessage('La nuova password deve avere almeno 8 caratteri'),
    body('confirmNewPassword').custom((value, { req }) => value === req.body.newPassword).withMessage('Le nuove password non coincidono')
];

// Richiesta reset password (dimenticata)
const requestPasswordResetValidator = [
    body('email').isEmail().withMessage('Email non valida')
];

// Verifica OTP per reset password
const verifyResetOtpValidator = [
    body('email').isEmail().withMessage('Email non valida'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP non valido')
];

// Set nuova password dopo OTP
const resetPasswordValidator = [
    body('email').isEmail().withMessage('Email non valida'),
    body('newPassword').isLength({ min: 8 }).withMessage('La nuova password deve avere almeno 8 caratteri'),
    body('confirmNewPassword').custom((value, { req }) => value === req.body.newPassword).withMessage('Le nuove password non coincidono')
];

module.exports = {
    registerValidator,
    loginValidator,
    otpValidator,
    resendOtpValidator,
    changePasswordValidator,
    requestPasswordResetValidator,
    verifyResetOtpValidator,
    resetPasswordValidator
};