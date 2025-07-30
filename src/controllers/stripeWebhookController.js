const prisma = require('../prisma');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const albumId = session.metadata?.albumId;

        if (userId && albumId) {
            try {
                await prisma.albumAccess.create({
                    data: { userId, albumId },
                });
            } catch (err) {
                // Log error, but always return 200 to Stripe
                console.error('Prisma error on album access create:', err);
            }
        }
    }

    // Stripe webhooks require a 2xx response in any case
    res.json({ received: true });
};