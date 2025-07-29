const prisma = require('../prisma');

exports.hasAlbumAccess = async (req, res) => {
    try {
        const albumId = req.params.albumId;
        const userId = req.user.id; // Assumi autenticazione JWT, req.user valorizzato da middleware

        const access = await prisma.albumAccess.findFirst({
            where: {
                userId,
                albumId,
            },
        });

        res.json({ accessGranted: !!access });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};