const request = require('supertest');
const express = require('express');

// Mock della singola istanza condivisa di Stripe
jest.mock('../../lib/stripe', () => ({
    webhooks: {
        constructEvent: jest.fn(),
    },
}));

jest.mock('../../prisma', () => ({
    albumAccess: {
        create: jest.fn(() => Promise.resolve({ id: 1 }))
    }
}));

const stripe = require('../../lib/stripe');
const stripeWebhookController = require('../../controllers/stripeWebhookController');

const app = express();
app.post(
    '/stripe',
    express.raw({ type: 'application/json' }),
    (req, res, next) => { req.rawBody = req.body; next(); },
    stripeWebhookController.handleStripeWebhook
);

describe('Stripe Webhook Controller', () => {
    beforeEach(() => {
        stripe.webhooks.constructEvent.mockReset();
        stripe.webhooks.constructEvent.mockImplementation(() => ({
            type: 'checkout.session.completed',
            data: {
                object: {
                    metadata: { userId: 'user1', albumId: 'album1' },
                }
            }
        }));
    });

    it('should process checkout.session.completed and return received', async () => {
        const res = await request(app)
            .post('/stripe')
            .set('stripe-signature', 'testsig')
            .send(Buffer.from('{}'));
        expect(res.statusCode).toBe(200);
        expect(res.body.received).toBe(true);
    });

    it('should return 400 if constructEvent throws', async () => {
        stripe.webhooks.constructEvent.mockImplementationOnce(() => { throw new Error('Invalid sig'); });

        const res = await request(app)
            .post('/stripe')
            .set('stripe-signature', 'invalid')
            .send(Buffer.from('{}'));
        expect(res.statusCode).toBe(400);
        expect(res.text).toMatch(/Webhook Error/);
    });
});