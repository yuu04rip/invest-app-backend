const { validationResult } = require('express-validator');

/**
 * Middleware universale per validare i dati in ingresso usando express-validator.
 * Se trova errori, restituisce 400 e la lista dettagliata.
 */
function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

module.exports = validate;