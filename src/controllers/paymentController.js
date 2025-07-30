const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

eexports.createCheckoutSession = async (req, res) => {
    try {
        const { products, userId, albumId } = req.body; // <-- aggiungi qui!
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: "Products required" });
        }

        const line_items = products.map(prod => ({
            price_data: {
                currency: "eur",
                product_data: { name: prod.name },
                unit_amount: Math.round(prod.price * 100),
            },
            quantity: prod.quantity || 1,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: 'myapp://payment-success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'myapp://payment-cancel',
            metadata: {
                userId,   // <-- qui metti l'id dell'utente
                albumId,  // <-- qui metti l'id dell'album
                // puoi aggiungere altri campi se vuoi
            }
        });

        res.json({ url: session.url });
    } catch (err) {
        res.status(500).json({ error: "Stripe error", details: err.message });
    }
};