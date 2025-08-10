const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Normalizza stringhe vuote -> null
function normalizeNullable(v) {
    if (v === undefined || v === null) return null;
    if (typeof v === 'string') {
        const t = v.trim();
        return t.length === 0 ? null : t;
    }
    return v;
}

// GET /api/profiles/me
// Ritorna 404 se il profilo non esiste ancora
exports.getMyProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const profile = await prisma.profile.findUnique({
            where: { userId },
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        return res.json(profile);
    } catch (err) {
        next(err);
    }
};

// PUT /api/profiles/me
// Crea o aggiorna il profilo dell’utente loggato
exports.updateMyProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const name = req.body?.name?.trim();
        const surname = req.body?.surname?.trim();
        const bio = normalizeNullable(req.body?.bio);
        const sector = normalizeNullable(req.body?.sector);
        const interests = normalizeNullable(req.body?.interests);

        // name e surname sono obbligatori (validator già li controlla)
        const updated = await prisma.profile.upsert({
            where: { userId },
            update: { name, surname, bio, sector, interests },
            create: { userId, name, surname, bio, sector, interests },
        });

        return res.json(updated); // 200 OK sia in create che update
    } catch (err) {
        next(err);
    }
};

// ADMIN: GET /api/profiles
exports.getAllProfiles = async (req, res, next) => {
    try {
        const profiles = await prisma.profile.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return res.json(profiles);
    } catch (err) {
        next(err);
    }
};

// ADMIN: GET /api/profiles/:id
exports.getProfileById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const profile = await prisma.profile.findUnique({ where: { id } });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        return res.json(profile);
    } catch (err) {
        next(err);
    }
};

// ADMIN: PUT /api/profiles/:id
exports.updateProfileById = async (req, res, next) => {
    try {
        const id = req.params.id;

        const name = req.body?.name?.trim();
        const surname = req.body?.surname?.trim();
        const bio = normalizeNullable(req.body?.bio);
        const sector = normalizeNullable(req.body?.sector);
        const interests = normalizeNullable(req.body?.interests);

        const updated = await prisma.profile.update({
            where: { id },
            data: { name, surname, bio, sector, interests },
        });

        return res.json(updated);
    } catch (err) {
        // Prisma P2025 = record non trovato
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Profile not found' });
        }
        next(err);
    }
};

// ADMIN: DELETE /api/profiles/:id
exports.deleteProfileById = async (req, res, next) => {
    try {
        const id = req.params.id;
        await prisma.profile.delete({ where: { id } });
        return res.status(204).send();
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Profile not found' });
        }
        next(err);
    }
};