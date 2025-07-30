const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 100, // massimo 100 richieste per IP per windowMs
    message: 'Troppe richieste, riprova più tardi.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = apiLimiter;