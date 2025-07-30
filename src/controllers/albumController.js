const prisma = require('../prisma');

// Crea nuovo album
exports.createAlbum = async (req, res) => {
    try {
        const { name, productIds } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        // Crea album
        const album = await prisma.album.create({
            data: {
                name,
                products: productIds
                    ? { connect: productIds.map(id => ({ id })) }
                    : undefined,
            },
            include: { products: true }
        });

        res.status(201).json(album);
    } catch (err) {
        res.status(500).json({ error: 'Unable to create album', details: err.message });
    }
};

// Lista album
exports.getAllAlbums = async (req, res) => {
    try {
        const albums = await prisma.album.findMany({ include: { products: true } });
        res.json(albums);
    } catch (err) {
        res.status(500).json({ error: 'Unable to fetch albums', details: err.message });
    }
};

// Dettaglio album
exports.getAlbumById = async (req, res) => {
    try {
        const { id } = req.params;
        const album = await prisma.album.findUnique({
            where: { id },
            include: { products: true }
        });
        if (!album) return res.status(404).json({ error: 'Album not found' });
        res.json(album);
    } catch (err) {
        res.status(500).json({ error: 'Unable to fetch album', details: err.message });
    }
};

// Modifica album
exports.updateAlbumById = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, productIds } = req.body;
        const album = await prisma.album.update({
            where: { id },
            data: {
                name,
                products: productIds
                    ? {
                        set: productIds.map(id => ({ id }))
                    }
                    : undefined,
            },
            include: { products: true }
        });
        res.json(album);
    } catch (err) {
        res.status(500).json({ error: 'Unable to update album', details: err.message });
    }
};

// Elimina album
exports.deleteAlbumById = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.album.delete({ where: { id } });
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: 'Unable to delete album', details: err.message });
    }
};