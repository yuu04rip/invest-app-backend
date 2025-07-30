const { body, param } = require('express-validator');

const createProductValidator = [
    body('name')
        .notEmpty()
        .withMessage('Il nome del prodotto è obbligatorio'),
    body('description')
        .optional()
        .isString()
        .withMessage('La descrizione deve essere una stringa'),
    body('price')
        .notEmpty()
        .withMessage('Il prezzo è obbligatorio')
        .isFloat({ gt: 0 })
        .withMessage('Il prezzo deve essere un numero maggiore di 0'),
    body('imageUrl')
        .optional()
        .isString()
        .withMessage('L\'URL dell\'immagine deve essere una stringa')
];

const updateProductValidator = [
    body('name')
        .optional()
        .isString()
        .withMessage('Il nome del prodotto deve essere una stringa'),
    body('description')
        .optional()
        .isString()
        .withMessage('La descrizione deve essere una stringa'),
    body('price')
        .optional()
        .isFloat({ gt: 0 })
        .withMessage('Il prezzo deve essere un numero maggiore di 0'),
    body('imageUrl')
        .optional()
        .isString()
        .withMessage('L\'URL dell\'immagine deve essere una stringa')
];

const idParamValidator = [
    param('id')
        .notEmpty()
        .withMessage('ID prodotto obbligatorio')
        .isString()
        .withMessage('ID prodotto deve essere una stringa')
];

module.exports = {
    createProductValidator,
    updateProductValidator,
    idParamValidator
};