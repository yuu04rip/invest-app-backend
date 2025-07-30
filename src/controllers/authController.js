const prisma = require('../prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/sendEmail'); // <--- IMPORTA IL MODULO EMAIL

function generateOTP() {
    // OTP di 6 cifre
    return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.register = async (req, res) => {
    try {
        const { email, password, role, referralCode } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verifica utente esistente
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: 'User already exists' });

        // Se referralCode presente, verifica che esista e non sia già usato
        let usedReferral = null;
        if (referralCode) {
            usedReferral = await prisma.referral.findUnique({ where: { code: referralCode } });
            if (!usedReferral) {
                return res.status(400).json({ error: 'Referral code not found' });
            }
            if (usedReferral.isUsed) {
                return res.status(400).json({ error: 'Referral code already used' });
            }
            if (new Date(usedReferral.expiresAt) < new Date()) {
                return res.status(400).json({ error: 'Referral code expired' });
            }
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // GENERA OTP & SCADENZA
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minuti

        // Crea utente
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                role,
                isActive: true,
                isVerified: false,            // <--- AGGIUNGI
                otpCode: otp,                 // <--- AGGIUNGI
                otpExpiresAt: otpExpiresAt,   // <--- AGGIUNGI
                otpAttempts: 0,               // <--- AGGIUNGI
            },
        });

        // CREA ANCHE IL PROFILO ASSOCIATO
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

        // Marca come usato il referral, se fornito
        if (usedReferral) {
            await prisma.referral.update({
                where: { code: referralCode },
                data: {
                    isUsed: true,
                    usedByUserId: user.id,
                },
            });
        }

        // INVIA L'EMAIL CON OTP
        const frontendVerifyUrl = process.env.FRONTEND_VERIFY_URL || 'http://localhost:3000/verify-otp';
        await sendEmail(email, otp, frontendVerifyUrl);

        res.status(201).json({
            id: user.id,
            email: user.email,
            role: user.role,
            message: 'Registrazione avvenuta. Controlla la mail per il codice di verifica OTP.'
        });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed', details: err.message });
    }
};

// LOGIN: ora accetta solo utenti con email verificata
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Cerca utente
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        // Verifica password
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        if (!user.isVerified) {
            return res.status(403).json({ error: 'Email non verificata. Controlla la tua casella mail e inserisci il codice OTP.' });
        }

        // Genera JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'supersecretkey',
            { expiresIn: '7d' }
        );

        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ENDPOINT PER VERIFICA OTP
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'Utente non trovato' });
        if (user.isVerified) return res.status(400).json({ error: 'Email già verificata' });
        if (user.otpAttempts >= 5) return res.status(429).json({ error: 'Troppi tentativi. Richiedi un nuovo codice.' });
        if (!user.otpCode || user.otpExpiresAt < new Date()) return res.status(400).json({ error: 'OTP scaduto. Richiedi un nuovo codice.' });

        if (user.otpCode !== otp) {
            await prisma.user.update({
                where: { email },
                data: { otpAttempts: { increment: 1 } }
            });
            return res.status(400).json({ error: 'Codice OTP errato' });
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

        res.json({ success: true, message: 'Email verificata!' });
    } catch (err) {
        res.status(500).json({ error: 'OTP verification failed', details: err.message });
    }
};

// ENDPOINT PER REINVIO OTP
exports.resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'Utente non trovato' });
        if (user.isVerified) return res.status(400).json({ error: 'Email già verificata' });

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

        res.json({ success: true, message: 'Nuovo codice inviato!' });
    } catch (err) {
        res.status(500).json({ error: 'Resend OTP failed', details: err.message });
    }
};