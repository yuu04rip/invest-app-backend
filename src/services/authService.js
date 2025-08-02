const prisma = require('../prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const generateOTP = require('../utils/generateOTP');

async function register({ email, password, role, referralCode }) {
    if (!email || !password || !role) {
        return { success: false, message: 'Missing required fields' };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return { success: false, message: 'User already exists' };
    }

    let usedReferral = null;
    if (referralCode) {
        usedReferral = await prisma.referral.findUnique({ where: { code: referralCode } });
        if (!usedReferral) {
            return { success: false, message: 'Referral code not found' };
        }
        if (usedReferral.isUsed) {
            return { success: false, message: 'Referral code already used' };
        }
        if (new Date(usedReferral.expiresAt) < new Date()) {
            return { success: false, message: 'Referral code expired' };
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
    try {
        await sendEmail(email, otp, frontendVerifyUrl);
    } catch (error) {
        return { success: false, message: 'Registrazione creata, ma invio email fallito: ' + error.message };
    }

    return {
        success: true,
        id: user.id,
        email: user.email,
        role: user.role,
        message: 'Registrazione avvenuta. Controlla la mail per il codice di verifica OTP.'
    };
}

async function login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return { success: false, message: 'Invalid credentials' };
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        return { success: false, message: 'Invalid credentials' };
    }

    if (!user.isVerified) {
        return { success: false, message: 'Email non verificata. Controlla la tua casella mail e inserisci il codice OTP.' };
    }

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '7d' }
    );

    return { success: true, token, user: { id: user.id, email: user.email, role: user.role } };
}

async function verifyOtp({ email, otp }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return { success: false, message: 'Utente non trovato' };
    }
    if (user.isVerified) {
        return { success: false, message: 'Email già verificata' };
    }
    if (user.otpAttempts >= 5) {
        return { success: false, message: 'Troppi tentativi. Richiedi un nuovo codice.' };
    }
    if (!user.otpCode || user.otpExpiresAt < new Date()) {
        return { success: false, message: 'OTP scaduto. Richiedi un nuovo codice.' };
    }

    if (user.otpCode !== otp) {
        await prisma.user.update({
            where: { email },
            data: { otpAttempts: { increment: 1 } }
        });
        return { success: false, message: 'Codice OTP errato' };
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
        return { success: false, message: 'Utente non trovato' };
    }
    if (user.isVerified) {
        return { success: false, message: 'Email già verificata' };
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
        return { success: false, message: 'Invio email fallito: ' + error.message };
    }

    return { success: true, message: 'Nuovo codice inviato!' };
}

module.exports = {
    register,
    login,
    verifyOtp,
    resendOtp,
};