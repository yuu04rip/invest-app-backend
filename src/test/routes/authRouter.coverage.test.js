const express = require('express');
const request = require('supertest');

// Mocks UNA SOLA VOLTA!
jest.mock('../../controllers/authController', () => ({
    register: jest.fn((req, res) => res.status(200).json({ route: 'register' })),
    login: jest.fn((req, res) => res.status(200).json({ route: 'login' })),
    verifyOtp: jest.fn((req, res) => res.status(200).json({ route: 'verifyOtp' })),
    resendOtp: jest.fn((req, res) => res.status(200).json({ route: 'resendOtp' })),
}));
jest.mock('../../middleware/authValidators', () => ({
    registerValidator: (req, res, next) => next(),
    loginValidator: (req, res, next) => next(),
    otpValidator: (req, res, next) => next(),
    resendOtpValidator: (req, res, next) => next(),
}));
jest.mock('../../middleware/validate', () => (req, res, next) => next());
jest.mock('../../middleware/rateLimiter', () => (req, res, next) => next());

const authRouter = require('../../routes/auth');

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

describe('auth.js router coverage', () => {
    it('POST /auth/register triggers route', async () => {
        const res = await request(app).post('/auth/register').send({ email: 'a@b.com', password: 'pw' });
        expect(res.status).toBe(200);
        expect(res.body.route).toBe('register');
    });

    it('POST /auth/login triggers route', async () => {
        const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'pw' });
        expect(res.status).toBe(200);
        expect(res.body.route).toBe('login');
    });

    it('POST /auth/verify-otp triggers route', async () => {
        const res = await request(app).post('/auth/verify-otp').send({ email: 'a@b.com', otp: '123456' });
        expect(res.status).toBe(200);
        expect(res.body.route).toBe('verifyOtp');
    });

    it('POST /auth/resend-otp triggers route', async () => {
        const res = await request(app).post('/auth/resend-otp').send({ email: 'a@b.com' });
        expect(res.status).toBe(200);
        expect(res.body.route).toBe('resendOtp');
    });
});