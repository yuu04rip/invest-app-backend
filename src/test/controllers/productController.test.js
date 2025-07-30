const request = require('supertest');
const express = require('express');
const productController = require('/src/controllers/productController');
jest.mock('/src/prisma', () => ({
    product: {
        create: jest.fn(({ data }) => Promise.resolve({ id: '1', ...data })),
        findMany: jest.fn(() => Promise.resolve([{ id: '1', name: 'Prod', price: 2 }])),
        findUnique: jest.fn(({ where }) => Promise.resolve(where.id === 'notfound' ? null : { id: where.id, name: 'Prod', price: 2 })),
        update: jest.fn(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
        delete: jest.fn(({ where }) => Promise.resolve({ id: where.id })),
    },
}));

// Middleware mock per il ruolo
function mockAuth(role = 'USER') {
    return (req, res, next) => {
        req.user = { id: 'mockUser', role };
        next();
    };
}

// Helper per creare app con ruolo specifico
function makeApp(role = 'USER') {
    const app = express();
    app.use(express.json());
    app.post('/products', mockAuth(role), productController.createProduct);
    app.get('/products', mockAuth(role), productController.getAllProducts);
    app.get('/products/:id', mockAuth(role), productController.getProductById);
    app.put('/products/:id', mockAuth(role), productController.updateProductById);
    app.delete('/products/:id', mockAuth(role), productController.deleteProductById);
    return app;
}

describe('Product Controller CRUD & Ruoli', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- TEST CRUD BASE (con role ADMIN per evitare blocchi) ---
    const app = makeApp('ADMIN');

    it('should create a product', async () => {
        const res = await request(app).post('/products').send({ name: 'Test', price: 10 });
        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe('Test');
    });

    it('should get all products', async () => {
        const res = await request(app).get('/products');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get a product by id', async () => {
        const res = await request(app).get('/products/1');
        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe('1');
    });

    it('should return 404 for non-existing product', async () => {
        const res = await request(app).get('/products/notfound');
        expect(res.statusCode).toBe(404);
    });

    it('should update a product', async () => {
        const res = await request(app).put('/products/1').send({ name: 'Updated' });
        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Updated');
    });

    it('should delete a product', async () => {
        const res = await request(app).delete('/products/1');
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Product deleted');
    });

    // ---- CASI LIMITE ----

    it('should return 500 if create throws', async () => {
        const prisma = require('/src/prisma');
        prisma.product.create.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app).post('/products').send({ name: 'Fail', price: 10 });
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toMatch(/DB error/);
    });

    it('should return 400 if required params are missing', async () => {
        const res = await request(app).post('/products').send({ price: 10 });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/missing/i);
    });

    it('should return 500 if update throws', async () => {
        const prisma = require('/src/prisma');
        prisma.product.update.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app).put('/products/1').send({ name: 'Oops' });
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toMatch(/DB error/);
    });

    it('should return 500 if delete throws', async () => {
        const prisma = require('/src/prisma');
        prisma.product.delete.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app).delete('/products/1');
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toMatch(/DB error/);
    });

    // ---- TEST RUOLI & ACL ----

    it('should forbid USER from creating a product', async () => {
        const userApp = makeApp('USER');
        const res = await request(userApp).post('/products').send({ name: 'Test', price: 10 });
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/forbidden/i);
    });

    it('should forbid GUEST from deleting a product', async () => {
        const guestApp = makeApp('GUEST');
        const res = await request(guestApp).delete('/products/1');
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/forbidden/i);
    });

    it('should allow USER to read products', async () => {
        const userApp = makeApp('USER');
        const res = await request(userApp).get('/products');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should allow ADMIN to create a product', async () => {
        const adminApp = makeApp('ADMIN');
        const res = await request(adminApp).post('/products').send({ name: 'AdminProd', price: 99 });
        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe('AdminProd');
    });
});