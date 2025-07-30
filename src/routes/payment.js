const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createCheckoutSessionValidator } = require('../middleware/paymentValidators');

router.post('/checkout', auth, createCheckoutSessionValidator, validate, paymentController.createCheckoutSession);

module.exports = router;