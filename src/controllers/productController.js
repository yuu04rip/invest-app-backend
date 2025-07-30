const prisma = require('../prisma');

// Crea nuovo prodotto
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, imageUrl } = req.body;
        // La validazione è ora nel middleware, quindi nessun controllo qui.
        const product = await prisma.product.create({
            data: {
                name,
                description,
                price: Number(price),
                imageUrl
            }
        });
        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({ error: 'Unable to create product', details: err.message });
    }
};

// Lista prodotti
exports.getAllProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Unable to fetch products', details: err.message });
    }
};

// Dettaglio singolo prodotto
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Unable to fetch product', details: err.message });
    }
};

// Modifica prodotto
exports.updateProductById = async (req, res) => {
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
        res.status(500).json({ error: 'Unable to update product', details: err.message });
    }
};

// Elimina prodotto
exports.deleteProductById = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({ where: { id } });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Unable to delete product', details: err.message });
    }
};