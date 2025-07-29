const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.post('/checkout', auth, paymentController.createCheckoutSession);

module.exports = router;