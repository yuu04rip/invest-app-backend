const { body } = require('express-validator');

const updateUserValidator = [
    body('username')
        .notEmpty()
        .withMessage('Il nome utente è obbligatorio')
        .isString()
        .trim(),
    body('profileImageUrl')
        .optional()
        .isURL()
        .withMessage('URL non valido per immagine profilo')
];

module.exports = { updateUserValidator };