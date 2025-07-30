const request = require('supertest');
const express = require('express');
const { createCheckoutSessionValidator } = require('/src/middleware/paymentValidators');
const validate = require('/src/middleware/validate');

const app = express();
app.use(express.json());
app.post('/checkout', createCheckoutSessionValidator, validate, (req, res) => res.status(200).json({ ok: true }));

describe('Payment Validators', () => {
    it('should fail if products is not an array', async () => {
        const res = await request(app).post('/checkout').send({ products: 'a', userId: '1', albumId: '2' });
        expect(res.statusCode).toBe(400);
    });

    it('should fail if products is empty', async () => {
        const res = await request(app).post('/checkout').send({ products: [], userId: '1', albumId: '2' });
        expect(res.statusCode).toBe(400);
    });

    it('should fail if userId is missing', async () => {
        const res = await request(app).post('/checkout').send({ products: [{ name: 'A', price: 10 }], albumId: '2' });
        expect(res.statusCode).toBe(400);
    });

    it('should fail if albumId is missing', async () => {
        const res = await request(app).post('/checkout').send({ products: [{ name: 'A', price: 10 }], userId: '1' });
        expect(res.statusCode).toBe(400);
    });

    it('should pass with valid data', async () => {
        const res = await request(app).post('/checkout').send({ products: [{ name: 'A', price: 10 }], userId: '1', albumId: '2' });
        expect(res.statusCode).toBe(200);
    });
});