const prisma = require('../prisma');

// Normalizza: stringhe vuote -> null
function normalizeNullable(v) {
    if (v === undefined || v === null) return null;
    if (typeof v === 'string') {
        const t = v.trim();
        return t.length === 0 ? null : t;
    }
    return v;
}

// GET /api/profile/me
exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Se nel tuo schema Profile ha la relazione "user", usa include per leggere subito la foto
        const prof = await prisma.profile.findUnique({
            where: { userId },
            include: { user: { select: { profileImageUrl: true } } },
        });

        if (!prof) return res.status(404).json({ error: 'Profile not found' });

        const { user, ...profile } = prof;
        return res.json({ ...profile, profileImageUrl: user?.profileImageUrl ?? null });
    } catch (err) {
        return res.status(500).json({ error: 'Unable to get profile', details: err.message });
    }
};

// PUT /api/profile/me (create or update + eventuale foto profilo)
exports.updateMyProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const name = (req.body?.name || '').trim();
        const surname = (req.body?.surname || '').trim();
        if (!name || !surname) {
            return res.status(400).json({ error: 'Name and surname are required.' });
        }

        const bio = normalizeNullable(req.body?.bio);
        const sector = normalizeNullable(req.body?.sector);
        const interests = normalizeNullable(req.body?.interests);
        const profileImageUrl = normalizeNullable(req.body?.profileImageUrl);

        // Usa la forma callback della transazione per gestire l’update condizionale
        const updated = await prisma.$transaction(async (tx) => {
            const updatedProfile = await tx.profile.upsert({
                where: { userId },
                update: { name, surname, bio, sector, interests },
                create: { userId, name, surname, bio, sector, interests },
            });

            if (profileImageUrl !== null) {
                await tx.user.update({
                    where: { id: userId },
                    data: { profileImageUrl },
                });
            }

            // Ritorna il profilo aggiornato insieme alla foto corrente
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { profileImageUrl: true },
            });

            return { ...updatedProfile, profileImageUrl: user?.profileImageUrl ?? null };
        });

        return res.json(updated);
    } catch (err) {
        return res.status(500).json({ error: 'Unable to update profile', details: err.message });
    }
};

exports.getAllProfiles = async (req, res) => {
    try {
        const profiles = await prisma.profile.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return res.json(profiles);
    } catch (err) {
        return res.status(500).json({ error: 'Unable to fetch profiles', details: err.message });
    }
};

exports.getProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        // Se vuoi includere anche qui la foto:
        const prof = await prisma.profile.findUnique({
            where: { id },
            include: { user: { select: { profileImageUrl: true } } },
        });
        if (!prof) return res.status(404).json({ error: 'Profile not found' });
        const { user, ...profile } = prof;
        return res.json({ ...profile, profileImageUrl: user?.profileImageUrl ?? null });
    } catch (err) {
        return res.status(500).json({ error: 'Unable to fetch profile', details: err.message });
    }
};

exports.updateProfileById = async (req, res) => {
    try {
        const { id } = req.params;

        const name = (req.body?.name || '').trim();
        const surname = (req.body?.surname || '').trim();
        if (!name || !surname) {
            return res.status(400).json({ error: 'Name and surname are required.' });
        }

        const bio = normalizeNullable(req.body?.bio);
        const sector = normalizeNullable(req.body?.sector);
        const interests = normalizeNullable(req.body?.interests);

        const updated = await prisma.profile.update({
            where: { id },
            data: { name, surname, bio, sector, interests },
        });

        return res.json(updated);
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Profile not found' });
        }
        return res.status(500).json({ error: 'Unable to update profile', details: err.message });
    }
};

exports.deleteProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.profile.delete({ where: { id } });
        return res.status(204).send();
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Profile not found' });
        }
        return res.status(500).json({ error: 'Unable to delete profile', details: err.message });
    }
};