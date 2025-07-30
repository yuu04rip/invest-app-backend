const prisma = require('../prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const generateOTP = require('../utils/generateOTP');

async function register({ email, password, role, referralCode }) {
    if (!email || !password || !role) {
        const error = new Error('Missing required fields');
        error.status = 400;
        throw error;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        const error = new Error('User already exists');
        error.status = 400;
        throw error;
    }

    let usedReferral = null;
    if (referralCode) {
        usedReferral = await prisma.referral.findUnique({ where: { code: referralCode } });
        if (!usedReferral) {
            const error = new Error('Referral code not found');
            error.status = 400;
            throw error;
        }
        if (usedReferral.isUsed) {
            const error = new Error('Referral code already used');
            error.status = 400;
            throw error;
        }
        if (new Date(usedReferral.expiresAt) < new Date()) {
            const error = new Error('Referral code expired');
            error.status = 400;
            throw error;
        }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            role,
            isActive: true,
            isVerified: false,
            otpCode: otp,
            otpExpiresAt: otpExpiresAt,
            otpAttempts: 0,
        },
    });

    await prisma.profile.create({
        data: {
            userId: user.id,
            name: "",
            surname: "",
            bio: "",
            sector: "",
            interests: "",
        }
    });

    if (usedReferral) {
        await prisma.referral.update({
            where: { code: referralCode },
            data: {
                isUsed: true,
                usedByUserId: user.id,
            },
        });
    }

    const frontendVerifyUrl = process.env.FRONTEND_VERIFY_URL || 'http://localhost:3000/verify-otp';
    await sendEmail(email, otp, frontendVerifyUrl);

    return {
        id: user.id,
        email: user.email,
        role: user.role,
        message: 'Registrazione avvenuta. Controlla la mail per il codice di verifica OTP.'
    };
}

async function login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
    }

    if (!user.isVerified) {
        const error = new Error('Email non verificata. Controlla la tua casella mail e inserisci il codice OTP.');
        error.status = 403;
        throw error;
    }

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '7d' }
    );

    return { token, user: { id: user.id, email: user.email, role: user.role } };
}

async function verifyOtp({ email, otp }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        const error = new Error('Utente non trovato');
        error.status = 400;
        throw error;
    }
    if (user.isVerified) {
        const error = new Error('Email già verificata');
        error.status = 400;
        throw error;
    }
    if (user.otpAttempts >= 5) {
        const error = new Error('Troppi tentativi. Richiedi un nuovo codice.');
        error.status = 429;
        throw error;
    }
    if (!user.otpCode || user.otpExpiresAt < new Date()) {
        const error = new Error('OTP scaduto. Richiedi un nuovo codice.');
        error.status = 400;
        throw error;
    }

    if (user.otpCode !== otp) {
        await prisma.user.update({
            where: { email },
            data: { otpAttempts: { increment: 1 } }
        });
        const error = new Error('Codice OTP errato');
        error.status = 400;
        throw error;
    }

    await prisma.user.update({
        where: { email },
        data: {
            isVerified: true,
            otpCode: null,
            otpExpiresAt: null,
            otpAttempts: 0,
        }
    });

    return { success: true, message: 'Email verificata!' };
}

async function resendOtp({ email }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        const error = new Error('Utente non trovato');
        error.status = 400;
        throw error;
    }
    if (user.isVerified) {
        const error = new Error('Email già verificata');
        error.status = 400;
        throw error;
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
        where: { email },
        data: {
            otpCode: otp,
            otpExpiresAt,
            otpAttempts: 0,
        }
    });

    const frontendVerifyUrl = process.env.FRONTEND_VERIFY_URL || 'http://localhost:3000/verify-otp';
    await sendEmail(email, otp, frontendVerifyUrl);

    return { success: true, message: 'Nuovo codice inviato!' };
}

module.exports = {
    register,
    login,
    verifyOtp,
    resendOtp,
};