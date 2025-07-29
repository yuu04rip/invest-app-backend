const prisma = require('../prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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

        // Crea utente
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                role,
                isActive: true,
            },
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

        res.status(201).json({
            id: user.id,
            email: user.email,
            role: user.role,
        });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed', details: err.message });
    }
};
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Cerca utente
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        // Verifica password
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

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