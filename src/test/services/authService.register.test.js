const authService = require('../../services/authService');
const prisma = require('../../prisma');
const sendEmail = require('../../utils/sendEmail');
const generateOTP = require('../../utils/generateOTP');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../../prisma');
jest.mock('../../utils/sendEmail');
jest.mock('../../utils/generateOTP', () => jest.fn(() => '123456'));

describe('authService login', () => {
    beforeEach(() => jest.clearAllMocks());

    it('lancia errore se utente non trovato', async () => {
        prisma.user.findUnique.mockResolvedValueOnce(null);
        await expect(authService.login({ email: 'a@b.com', password: 'pw' }))
            .rejects.toThrow('Invalid credentials');
    });

    it('lancia errore se password non valida', async () => {
        prisma.user.findUnique.mockResolvedValueOnce({ id: 1, email: 'a@b.com', passwordHash: 'hash', isVerified: true, role: 'user' });
        jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);
        await expect(authService.login({ email: 'a@b.com', password: 'pw' }))
            .rejects.toThrow('Invalid credentials');
    });

    it('lancia errore se email non verificata', async () => {
        prisma.user.findUnique.mockResolvedValueOnce({ id: 1, email: 'a@b.com', passwordHash: 'hash', isVerified: false, role: 'user' });
        jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
        await expect(authService.login({ email: 'a@b.com', password: 'pw' }))
            .rejects.toThrow('Email non verificata');
    });

    it('login OK con JWT_SECRET di default', async () => {
        prisma.user.findUnique.mockResolvedValueOnce({ id: 1, email: 'a@b.com', passwordHash: 'hash', isVerified: true, role: 'user' });
        jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
        delete process.env.JWT_SECRET; // Per coprire il ramo 'supersecretkey'
        const result = await authService.login({ email: 'a@b.com', password: 'pw' });
        expect(result).toHaveProperty('token');
        expect(result.user.email).toBe('a@b.com');
    });
});

describe('authService.verifyOtp', () => {
    beforeEach(() => jest.clearAllMocks());

    it('lancia errore se utente non trovato', async () => {
        prisma.user.findUnique.mockResolvedValueOnce(null);
        await expect(authService.verifyOtp({ email: 'test@no.com', otp: '123' }))
            .rejects.toThrow('Utente non trovato');
    });

    it('lancia errore se email già verificata', async () => {
        prisma.user.findUnique.mockResolvedValueOnce({ isVerified: true });
        await expect(authService.verifyOtp({ email: 'test@ok.com', otp: '123' }))
            .rejects.toThrow('Email già verificata');
    });

    it('lancia errore se troppi tentativi', async () => {
        prisma.user.findUnique.mockResolvedValueOnce({ isVerified: false, otpAttempts: 5 });
        await expect(authService.verifyOtp({ email: 'test@ok.com', otp: '123' }))
            .rejects.toThrow('Troppi tentativi. Richiedi un nuovo codice.');
    });

    it('lancia errore se OTP scaduto', async () => {
        prisma.user.findUnique.mockResolvedValueOnce({
            isVerified: false, otpAttempts: 1, otpCode: '123', otpExpiresAt: new Date(Date.now() - 10000)
        });
        await expect(authService.verifyOtp({ email: 'test@ok.com', otp: '123' }))
            .rejects.toThrow('OTP scaduto. Richiedi un nuovo codice.');
    });

    it('lancia errore se OTP errato', async () => {
        prisma.user.findUnique.mockResolvedValueOnce({
            isVerified: false, otpAttempts: 1, otpCode: '456', otpExpiresAt: new Date(Date.now() + 10000)
        });
        prisma.user.update.mockResolvedValueOnce({});
        await expect(authService.verifyOtp({ email: 'test@ok.com', otp: '123' }))
            .rejects.toThrow('Codice OTP errato');
    });

    it('verifica successo se OTP giusto', async () => {
        prisma.user.findUnique.mockResolvedValueOnce({
            isVerified: false, otpAttempts: 1, otpCode: '123', otpExpiresAt: new Date(Date.now() + 10000)
        });
        prisma.user.update.mockResolvedValueOnce({});
        await expect(authService.verifyOtp({ email: 'test@ok.com', otp: '123' }))
            .resolves.toEqual({ success: true, message: 'Email verificata!' });
    });
});

describe('authService.resendOtp', () => {
    beforeEach(() => jest.clearAllMocks());

    it('lancia errore se utente non trovato', async () => {
        prisma.user.findUnique.mockResolvedValueOnce(null);
        await expect(authService.resendOtp({ email: 'test@no.com' }))
            .rejects.toThrow('Utente non trovato');
    });

    it('lancia errore se email già verificata', async () => {
        prisma.user.findUnique.mockResolvedValueOnce({ isVerified: true });
        await expect(authService.resendOtp({ email: 'test@ok.com' }))
            .rejects.toThrow('Email già verificata');
    });

    it('resendOtp successo', async () => {
        prisma.user.findUnique.mockResolvedValueOnce({ isVerified: false });
        prisma.user.update.mockResolvedValueOnce({});
        sendEmail.mockResolvedValueOnce();
        await expect(authService.resendOtp({ email: 'test@ok.com' })).resolves.toEqual({
            success: true,
            message: 'Nuovo codice inviato!'
        });
    });
});
describe('authService.register - extra coverage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed');
    });

    it('happy path senza referral', async () => {
        prisma.user.findUnique.mockResolvedValueOnce(null); // no user exists
        prisma.user.create.mockResolvedValueOnce({ id: 1, email: 'new@user.com', role: 'user' });
        prisma.profile.create.mockResolvedValueOnce({});
        sendEmail.mockResolvedValueOnce();

        const result = await authService.register({
            email: 'new@user.com',
            password: 'pw',
            role: 'user'
        });

        expect(result).toEqual({
            id: 1,
            email: 'new@user.com',
            role: 'user',
            message: expect.stringContaining('Registrazione avvenuta')
        });
        expect(prisma.user.create).toHaveBeenCalled();
        expect(prisma.profile.create).toHaveBeenCalled();
        expect(sendEmail).toHaveBeenCalled();
    });

    it('happy path con referral valido', async () => {
        prisma.user.findUnique.mockResolvedValueOnce(null); // no user exists
        // referral valido, non usato, non scaduto
        prisma.referral.findUnique.mockResolvedValueOnce({
            isUsed: false,
            expiresAt: new Date(Date.now() + 100000)
        });
        prisma.user.create.mockResolvedValueOnce({ id: 2, email: 'ref@user.com', role: 'user' });
        prisma.profile.create.mockResolvedValueOnce({});
        prisma.referral.update.mockResolvedValueOnce({});
        sendEmail.mockResolvedValueOnce();

        const result = await authService.register({
            email: 'ref@user.com',
            password: 'pw',
            role: 'user',
            referralCode: 'ABC123'
        });

        expect(result).toHaveProperty('id', 2);
        expect(prisma.referral.update).toHaveBeenCalledWith({
            where: { code: 'ABC123' },
            data: { isUsed: true, usedByUserId: 2 }
        });
    });
});