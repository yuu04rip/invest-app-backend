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

// GET /api/profiles/me
exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user?.userId; // coerente con il tuo auth
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const profile = await prisma.profile.findUnique({ where: { userId } });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: 'Unable to get profile', details: err.message });
    }
};

// PUT /api/profiles/me  (create or update)
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

        const updated = await prisma.profile.upsert({
            where: { userId },
            update: { name, surname, bio, sector, interests },
            create: { userId, name, surname, bio, sector, interests },
        });

        res.json(updated); // 200 OK
    } catch (err) {
        res.status(500).json({ error: 'Unable to update profile', details: err.message });
    }
};

exports.getAllProfiles = async (req, res) => {
    try {
        const profiles = await prisma.profile.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(profiles);
    } catch (err) {
        res.status(500).json({ error: 'Unable to fetch profiles', details: err.message });
    }
};

exports.getProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await prisma.profile.findUnique({ where: { id } });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: 'Unable to fetch profile', details: err.message });
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

        res.json(updated);
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.status(500).json({ error: 'Unable to update profile', details: err.message });
    }
};

exports.deleteProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.profile.delete({ where: { id } });
        res.status(204).send();
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.status(500).json({ error: 'Unable to delete profile', details: err.message });
    }
};