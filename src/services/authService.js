const prisma = require('../prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const generateOTP = require('../utils/generateOTP');

/**
 * Helper per lanciare errori con status code custom.
 */
function throwError(msg, status = 400) {
    const err = new Error(msg);
    err.status = status;
    throw err;
}

async function register({ email, password, role, referralCode, username }) {
    if (!email || !password || !role) {
        throwError('Missing required fields', 400);
    }

    // Username obbligatorio
    if (!username) {
        username = `user_${Math.floor(Math.random() * 1000000000)}`;
    }

    // Controlla unicità email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throwError('User already exists', 400);
    }

    // Controlla unicità username
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
        throwError('Username già esistente, scegli un altro.', 400);
    }

    let usedReferral = null;
    if (referralCode) {
        usedReferral = await prisma.referral.findUnique({ where: { code: referralCode } });
        if (!usedReferral) {
            throwError('Referral code not found', 404);
        }
        if (usedReferral.isUsed) {
            throwError('Referral code already used', 400);
        }
        if (new Date(usedReferral.expiresAt) < new Date()) {
            throwError('Referral code expired', 400);
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
            username,
            // profileImageUrl opzionale da frontend
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
    try {
        await sendEmail(email, otp, frontendVerifyUrl);
    } catch (error) {
        throwError('Registrazione creata, ma invio email fallito: ' + error.message, 500);
    }

    return {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        message: 'Registrazione avvenuta. Controlla la mail per il codice di verifica OTP.'
    };
}

async function login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throwError('Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        throwError('Invalid credentials', 401);
    }

    if (!user.isVerified) {
        throwError('Email non verificata', 403);
    }

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '7d' }
    );

    return { token, user: { id: user.id, email: user.email, role: user.role, username: user.username } };
}

async function verifyOtp({ email, otp }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throwError('Utente non trovato', 401);
    }
    if (user.isVerified) {
        throwError('Email già verificata', 400);
    }
    if (user.otpAttempts >= 5) {
        throwError('Troppi tentativi. Richiedi un nuovo codice.', 401);
    }
    if (!user.otpCode || user.otpExpiresAt < new Date()) {
        throwError('OTP scaduto. Richiedi un nuovo codice.', 401);
    }

    if (user.otpCode !== otp) {
        await prisma.user.update({
            where: { email },
            data: { otpAttempts: { increment: 1 } }
        });
        throwError('Codice OTP errato', 400);
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
        throwError('Utente non trovato', 401);
    }
    if (user.isVerified) {
        throwError('Email già verificata', 400);
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
    try {
        await sendEmail(email, otp, frontendVerifyUrl);
    } catch (error) {
        throwError('Invio email fallito: ' + error.message, 500);
    }

    return { success: true, message: 'Nuovo codice inviato!' };
}

module.exports = {
    register,
    login,
    verifyOtp,
    resendOtp,
};