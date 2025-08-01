const stripe = require('../lib/stripe');
const prisma = require('../prisma');

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
        console.error('Stripe webhook error:', err);
        return res.status(400).send('Webhook Error: richiesta non valida.');
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