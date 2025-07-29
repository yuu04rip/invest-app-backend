const prisma = require('../prisma');

// Ottieni il profilo dell'utente loggato
exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await prisma.profile.findUnique({
            where: { userId }
        });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: 'Unable to get profile', details: err.message });
    }
};

// Crea o aggiorna il profilo dell'utente loggato
exports.updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, surname, bio, sector, interests } = req.body;

        let profile = await prisma.profile.findUnique({ where: { userId } });
        if (!profile) {
            // Crea nuovo profilo
            profile = await prisma.profile.create({
                data: {
                    userId,
                    name,
                    surname,
                    bio,
                    sector,
                    interests,
                }
            });
        } else {
            // Aggiorna profilo esistente
            profile = await prisma.profile.update({
                where: { userId },
                data: { name, surname, bio, sector, interests }
            });
        }
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: 'Unable to update profile', details: err.message });
    }
};
exports.getAllProfiles = async (req, res) => {
    try {
        const profiles = await prisma.profile.findMany();
        res.json(profiles);
    } catch (err) {
        res.status(500).json({ error: 'Unable to fetch profiles', details: err.message });
    }
};

// Dettaglio profilo per ID
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

// Modifica profilo per ID
exports.updateProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, surname, bio, sector, interests } = req.body;
        const profile = await prisma.profile.update({
            where: { id },
            data: { name, surname, bio, sector, interests }
        });
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: 'Unable to update profile', details: err.message });
    }
};

// Elimina profilo per ID
exports.deleteProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.profile.delete({ where: { id } });
        res.json({ message: 'Profile deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Unable to delete profile', details: err.message });
    }
};