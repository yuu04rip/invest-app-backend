const rateLimit = require('express-rate-limit');

const chatRateLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minuto
    max: 20,              // max 20 richieste/minuto per IP
    message: "Troppi messaggi, riprova più tardi."
});

module.exports = chatRateLimiter;