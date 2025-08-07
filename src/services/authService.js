const prisma = require('../prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail, sendResetOtpEmail } = require('../utils/sendEmail');
const generateOTP = require('../utils/generateOTP');

/**
 * Helper per lanciare errori con status code custom.
 */
function throwError(msg, status = 400) {
    const err = new Error(msg);
    err.status = status;
    throw err;
}

// REGISTRAZIONE
async function register({ email, password, role, referralCode, username }) {
    if (!email || !password || !role) {
        throwError('Missing required fields', 400);
    }
    if (!username) {
        username = `user_${Math.floor(Math.random() * 1000000000)}`;
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throwError('User already exists', 400);
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) throwError('Username già esistente, scegli un altro.', 400);

    let usedReferral = null;
    if (referralCode) {
        usedReferral = await prisma.referral.findUnique({ where: { code: referralCode } });
        if (!usedReferral) throwError('Referral code not found', 404);
        if (usedReferral.isUsed) throwError('Referral code already used', 400);
        if (new Date(usedReferral.expiresAt) < new Date()) throwError('Referral code expired', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Usa una transazione atomica!
    let result;
    try {
        result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    role,
                    isActive: true,
                    isVerified: false,
                    otpCode: otp,
                    otpExpiresAt,
                    otpAttempts: 0,
                    username,
                },
            });

            await tx.profile.create({
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
                await tx.referral.update({
                    where: { code: referralCode },
                    data: {
                        isUsed: true,
                        usedByUserId: user.id,
                    },
                });
            }

            return user;
        });
    } catch (err) {
        // FK violation, unique, or other error: rendilo umano
        if (err.code === 'P2003') {
            throwError('Errore interno creazione utente: vincolo non rispettato (profile/user).', 500);
        }
        throw err;
    }

    const frontendVerifyUrl = process.env.FRONTEND_VERIFY_URL || 'http://localhost:3000/verify-otp';
    try {
        await sendEmail(email, otp, frontendVerifyUrl);
    } catch (error) {
        throwError('Registrazione creata, ma invio email fallito: ' + error.message, 500);
    }

    return {
        success: true,
        id: result.id,
        email: result.email,
        role: result.role,
        username: result.username,
        message: 'Registrazione avvenuta. Controlla la mail per il codice di verifica OTP.'
    };
}

// LOGIN
async function login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    console.log("DEBUG isVerified in login:", user && user.isVerified); // <-- DEBUG
    if (!user) throwError('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throwError('Invalid credentials', 401);
    if (!user.isVerified) throwError('Email non verificata', 403);

    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '7d' }
    );

    return { token, user: { id: user.id, email: user.email, role: user.role, username: user.username } };
}

// VERIFICA OTP REGISTRAZIONE
async function verifyOtp({ email, otp }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throwError('Utente non trovato', 401);
    if (user.isVerified) throwError('Email già verificata', 400);
    if (user.otpAttempts >= 5) throwError('Troppi tentativi. Richiedi un nuovo codice.', 401);
    if (!user.otpCode || user.otpExpiresAt < new Date()) throwError('OTP scaduto. Richiedi un nuovo codice.', 401);

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

    const updated = await prisma.user.findUnique({ where: { email } });
    console.log("DEBUG isVerified dopo verifyOtp:", updated && updated.isVerified); // <-- DEBUG

    return { success: true, message: 'Email verificata!' };
}

// REINVIO OTP REGISTRAZIONE
async function resendOtp({ email }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throwError('Utente non trovato', 401);
    if (user.isVerified) throwError('Email già verificata', 400);

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

// CAMBIO PASSWORD AUTENTICATO
async function changePassword({ userId, oldPassword, newPassword, confirmNewPassword }) {
    if (newPassword !== confirmNewPassword) throwError('Le nuove password non coincidono', 400);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throwError('Utente non trovato', 404);
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) throwError('Password attuale errata', 401);

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hash }
    });
    return { success: true, message: 'Password aggiornata!' };
}

// RESET PASSWORD DIMENTICATA - STEP 1: Invio OTP
async function requestPasswordReset({ email }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: true, message: 'Se l\'email è registrata riceverai le istruzioni.' };

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 cifre
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minuti

    await prisma.user.update({
        where: { email },
        data: {
            resetPasswordOtp: otp,
            resetPasswordOtpExpires: expires
        }
    });

    await sendResetOtpEmail(email, otp);
    return { success: true, message: 'Se l\'email è registrata riceverai le istruzioni.' };
}

// RESET PASSWORD DIMENTICATA - STEP 2: Verifica OTP
async function verifyResetOtp({ email, otp }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpires) throwError('OTP non valido', 400);
    if (user.resetPasswordOtp !== otp) throwError('OTP non valido', 400);
    if (user.resetPasswordOtpExpires < new Date()) throwError('OTP scaduto', 400);

    // Cancella OTP dopo verifica, oppure metti un flag canResetPassword: true se vuoi sicurezza extra
    await prisma.user.update({
        where: { email },
        data: {
            resetPasswordOtp: null,
            resetPasswordOtpExpires: null
        }
    });

    return { success: true, message: 'OTP verificato, puoi impostare la nuova password.' };
}

// RESET PASSWORD DIMENTICATA - STEP 3: Nuova password
async function resetPassword({ email, newPassword, confirmNewPassword }) {
    if (newPassword !== confirmNewPassword) throwError('Le nuove password non coincidono', 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throwError('Utente non trovato', 404);

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { email },
        data: {
            passwordHash: hash,
            resetPasswordOtp: null,
            resetPasswordOtpExpires: null
        }
    });

    return { success: true, message: 'Password aggiornata!' };
}

module.exports = {
    register,
    login,
    verifyOtp,
    resendOtp,
    changePassword,
    requestPasswordReset,
    verifyResetOtp,
    resetPassword,
};