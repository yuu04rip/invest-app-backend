const authService = require('../services/authService');

// REGISTRAZIONE
exports.register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        console.log("DEBUG register result:", result); // DEBUG
        res.status(201).json(result);
    } catch (err) {
        console.error("DEBUG register error:", err);
        next(err);
    }
};

// LOGIN
exports.login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        console.log("DEBUG login result:", result); // DEBUG
        res.json(result);
    } catch (err) {
        console.error("DEBUG login error:", err);
        next(err);
    }
};

// VERIFY OTP (usa SOLO il service, non Prisma diretto)
exports.verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        console.log("DEBUG verifyOtp input:", { email, otp }); // DEBUG
        const result = await authService.verifyOtp({ email, otp });
        console.log("DEBUG verifyOtp result:", result); // DEBUG
        res.json(result);
    } catch (err) {
        console.error("DEBUG verifyOtp error:", err);
        next(err);
    }
};

exports.resendOtp = async (req, res, next) => {
    try {
        const result = await authService.resendOtp(req.body);
        console.log("DEBUG resendOtp result:", result); // DEBUG
        res.json(result);
    } catch (err) {
        console.error("DEBUG resendOtp error:", err);
        next(err);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;
        console.log("DEBUG changePassword input:", { userId, oldPassword, newPassword }); // DEBUG
        const result = await authService.changePassword({ userId, oldPassword, newPassword });
        console.log("DEBUG changePassword result:", result); // DEBUG
        res.json(result);
    } catch (err) {
        console.error("DEBUG changePassword error:", err);
        next(err);
    }
};

exports.requestPasswordReset = async (req, res, next) => {
    try {
        const result = await authService.requestPasswordReset(req.body);
        console.log("DEBUG requestPasswordReset result:", result); // DEBUG
        res.json(result);
    } catch (err) {
        console.error("DEBUG requestPasswordReset error:", err);
        next(err);
    }
};

exports.verifyResetOtp = async (req, res, next) => {
    try {
        const result = await authService.verifyResetOtp(req.body);
        console.log("DEBUG verifyResetOtp result:", result); // DEBUG
        res.json(result);
    } catch (err) {
        console.error("DEBUG verifyResetOtp error:", err);
        next(err);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const result = await authService.resetPassword(req.body);
        console.log("DEBUG resetPassword result:", result); // DEBUG
        res.json(result);
    } catch (err) {
        console.error("DEBUG resetPassword error:", err);
        next(err);
    }
};

// ---------- AGGIUNTA: LOGOUT ----------
exports.logout = async (req, res, next) => {
    try {
        if (req.body.refreshToken && authService.logout) {
            await authService.logout({ userId: req.user.id, refreshToken: req.body.refreshToken });
        }
        console.log("DEBUG logout success");
        res.json({ success: true, message: "Logout effettuato" });
    } catch (err) {
        console.error("DEBUG logout error:", err);
        next(err);
    }
};

// ---------- AGGIUNTA: PROFILO UTENTE ----------
exports.profile = async (req, res, next) => {
    try {
        console.log("DEBUG profile req.user:", req.user); // DEBUG
        res.json({ user: req.user });
    } catch (err) {
        console.error("DEBUG profile error:", err);
        next(err);
    }
};