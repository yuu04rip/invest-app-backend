const { body } = require('express-validator');

const createCheckoutSessionValidator = [
    body('products')
        .isArray({ min: 1 }).withMessage('Products deve essere un array non vuoto'),
    body('products.*.name')
        .notEmpty().withMessage('Il nome del prodotto è obbligatorio'),
    body('products.*.price')
        .isFloat({ gt: 0 }).withMessage('Il prezzo deve essere maggiore di 0'),
    body('products.*.quantity')
        .optional().isInt({ min: 1 }).withMessage('La quantità deve essere almeno 1'),
    body('userId')
        .notEmpty().withMessage('userId obbligatorio'),
    body('albumId')
        .notEmpty().withMessage('albumId obbligatorio')
];

module.exports = {
    createCheckoutSessionValidator
};