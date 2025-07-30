const request = require('supertest');
const express = require('express');
const paymentController = require('/src/controllers/paymentController');

jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => ({
        checkout: {
            sessions: {
                create: jest.fn(() => Promise.resolve({ url: 'https://stripe-session.url' })),
            },
        },
    }));
});

const app = express();
app.use(express.json());
app.post('/checkout', paymentController.createCheckoutSession);

describe('Payment Controller', () => {
    it('should create a checkout session', async () => {
        const res = await request(app)
            .post('/checkout')
            .send({
                products: [{ name: 'A', price: 10, quantity: 2 }],
                userId: 'user1',
                albumId: 'album1'
            });
        expect(res.statusCode).toBe(200);
        expect(res.body.url).toBe('https://stripe-session.url');
    });
});