const prisma = require('../prisma');

// Restituisce dati utente, profilo e referral
exports.me = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                username: true,
                profileImageUrl: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                Profile: true,
                referrals: true,
                usedReferrals: true
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// Controlla se username è disponibile
exports.checkUsername = async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username obbligatorio' });
    const exists = await prisma.user.findUnique({ where: { username } });
    res.json({ available: !exists });
};

// Aggiorna username e/o profileImageUrl
exports.updateMe = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { username, profileImageUrl } = req.body;
        if (!username) return res.status(400).json({ error: 'Username obbligatorio' });

        // Verifica unicità username
        const exists = await prisma.user.findUnique({ where: { username } });
        if (exists && exists.id !== userId)
            return res.status(409).json({ error: 'Username già esistente' });

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                username,
                ...(profileImageUrl ? { profileImageUrl } : {})
            }
        });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Unable to update user', details: err.message });
    }
};