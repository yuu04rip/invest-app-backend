const request = require('supertest');
const express = require('express');
const { createProductValidator, updateProductValidator, idParamValidator } = require('/src/middleware/productValidators');
const validate = require('/src/middleware/validate');

const app = express();
app.use(express.json());
app.post('/products', createProductValidator, validate, (req, res) => res.status(200).json({ ok: true }));
app.put('/products/:id', idParamValidator, validate, updateProductValidator, validate, (req, res) => res.status(200).json({ ok: true }));

describe('Product Validators', () => {
    it('should fail if name is missing in create', async () => {
        const res = await request(app).post('/products').send({ price: 10 });
        expect(res.statusCode).toBe(400);
    });

    it('should fail if price is missing in create', async () => {
        const res = await request(app).post('/products').send({ name: 'Test' });
        expect(res.statusCode).toBe(400);
    });

    it('should pass with valid create body', async () => {
        const res = await request(app).post('/products').send({ name: 'Test', price: 10 });
        expect(res.statusCode).toBe(200);
    });

    it('should fail update if id is missing', async () => {
        const res = await request(app).put('/products/').send({ name: 'Test' });
        expect(res.statusCode).toBe(404); // route not matched
    });

    it('should fail update if price is not a number', async () => {
        const res = await request(app).put('/products/123').send({ price: 'a' });
        expect(res.statusCode).toBe(400);
    });

    it('should pass with valid update body', async () => {
        const res = await request(app).put('/products/123').send({ name: 'Test', price: 12 });
        expect(res.statusCode).toBe(200);
    });
});