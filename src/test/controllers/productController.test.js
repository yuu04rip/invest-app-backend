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

const app = express();
app.use(express.json());
app.post('/products', productController.createProduct);
app.get('/products', productController.getAllProducts);
app.get('/products/:id', productController.getProductById);
app.put('/products/:id', productController.updateProductById);
app.delete('/products/:id', productController.deleteProductById);

describe('Product Controller', () => {
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
});