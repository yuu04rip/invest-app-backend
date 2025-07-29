const prisma = require('../prisma');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.rawBody, // Assicurati che il body non sia parsificato!
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        // Recupera userId e albumId dagli oggetti metadata della sessione Stripe
        const userId = session.metadata?.userId;
        const albumId = session.metadata?.albumId;

        if (userId && albumId) {
            await prisma.albumAccess.create({
                data: {
                    userId,
                    albumId,
                },
            });
        }
    }

    res.json({ received: true });
};