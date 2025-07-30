// index.js
const express = require('express');
const app = express();
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const referralRoutes = require('./routes/referral');
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');
const albumRoutes = require('./routes/album');
const paymentRoutes = require('./routes/payment');
const albumAccessRoutes = require('./routes/albumAccess');
const stripeWebhookRoutes = require('./routes/stripeWebhook');
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/album-access', albumAccessRoutes);
app.use('/webhook', stripeWebhookRoutes);
app.get('/', (req, res) => {
    res.send('Invest App Backend is running!');
});

module.exports = app;
