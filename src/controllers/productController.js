const prisma = require('../prisma');

// Middleware di controllo ruolo (puoi spostarlo in un file separato)
function requireRole(...roles) {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole || !roles.includes(userRole)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}

// Crea nuovo prodotto (solo ADMIN)
exports.createProduct = [
    requireRole('ADMIN'),
    async (req, res) => {
        try {
            const { name, description, price, imageUrl } = req.body;
            if (!name || price == null) {
                return res.status(400).json({ error: 'Missing required field: name or price' });
            }
            const product = await prisma.product.create({
                data: { name, description, price: Number(price), imageUrl }
            });
            res.status(201).json(product);
        } catch (err) {
            res.status(500).json({ error: err.message || 'Unable to create product' });
        }
    }
];

// Lista prodotti (tutti i ruoli)
exports.getAllProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message || 'Unable to fetch products' });
    }
};

// Dettaglio singolo prodotto (tutti i ruoli)
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message || 'Unable to fetch product' });
    }
};

// Modifica prodotto (solo ADMIN)
exports.updateProductById = [
    requireRole('ADMIN'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, price, imageUrl } = req.body;
            const product = await prisma.product.update({
                where: { id },
                data: {
                    name,
                    description,
                    price: price !== undefined ? Number(price) : undefined,
                    imageUrl
                }
            });
            res.json(product);
        } catch (err) {
            res.status(500).json({ error: err.message || 'Unable to update product' });
        }
    }
];

// Elimina prodotto (solo ADMIN)
exports.deleteProductById = [
    requireRole('ADMIN'),
    async (req, res) => {
        try {
            const { id } = req.params;
            await prisma.product.delete({ where: { id } });
            res.json({ message: 'Product deleted' });
        } catch (err) {
            res.status(500).json({ error: err.message || 'Unable to delete product' });
        }
    }
];