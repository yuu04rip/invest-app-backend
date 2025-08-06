const authService = require('../services/authService');

exports.register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.verifyOtp = async (req, res, next) => {
    try {
        const result = await authService.verifyOtp(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.resendOtp = async (req, res, next) => {
    try {
        const result = await authService.resendOtp(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;
        const result = await authService.changePassword({ userId, oldPassword, newPassword });
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.requestPasswordReset = async (req, res, next) => {
    try {
        const result = await authService.requestPasswordReset(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.verifyResetOtp = async (req, res, next) => {
    try {
        const result = await authService.verifyResetOtp(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const result = await authService.resetPassword(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};