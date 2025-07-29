const prisma = require('../prisma');
const { addDays } = require('date-fns');

// Utility per generare un codice referral univoco
function generateCode(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Crea un referral code (con scadenza)
exports.generate = async (req, res) => {
    try {
        const codeLength = 8;
        let code;
        let unique = false;
        while (!unique) {
            code = generateCode(codeLength);
            const exists = await prisma.referral.findUnique({ where: { code } });
            if (!exists) unique = true;
        }
        const expiresAt = addDays(new Date(), 30); // scade tra 30 giorni
        const referral = await prisma.referral.create({
            data: {
                code,
                creatorUserId: req.user.userId,
                expiresAt,
            },
        });
        res.json({ code: referral.code, expiresAt: referral.expiresAt });
    } catch (err) {
        res.status(500).json({ error: 'Unable to generate referral', details: err.message });
    }
};

// Mostra i referral creati e usati dall'utente
exports.myReferrals = async (req, res) => {
    try {
        const userId = req.user.userId;

        // referral generati
        const created = await prisma.referral.findMany({
            where: { creatorUserId: userId },
            select: {
                code: true,
                isUsed: true,
                expiresAt: true,
                createdAt: true,
                usedBy: { select: { id: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        // referral usati
        const used = await prisma.referral.findMany({
            where: { usedByUserId: userId },
            select: {
                code: true,
                isUsed: true,
                expiresAt: true,
                createdAt: true,
                creator: { select: { id: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ created, used });
    } catch (err) {
        res.status(500).json({ error: 'Unable to get referrals', details: err.message });
    }
};