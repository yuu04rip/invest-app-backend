const { body, param } = require('express-validator');

const createAlbumValidator = [
    body('name')
        .notEmpty()
        .withMessage('Il nome dell\'album è obbligatorio'),
    body('productIds')
        .optional()
        .isArray()
        .withMessage('productIds deve essere un array'),
    body('productIds.*')
        .optional()
        .isString()
        .withMessage('Ogni productId deve essere una stringa')
];

const updateAlbumValidator = [
    body('name')
        .optional()
        .isString()
        .withMessage('Il nome dell\'album deve essere una stringa'),
    body('productIds')
        .optional()
        .isArray()
        .withMessage('productIds deve essere un array'),
    body('productIds.*')
        .optional()
        .isString()
        .withMessage('Ogni productId deve essere una stringa')
];

const idParamValidator = [
    param('id')
        .notEmpty()
        .withMessage('ID album obbligatorio')
        .isString()
        .withMessage('ID album deve essere una stringa')
];

module.exports = {
    createAlbumValidator,
    updateAlbumValidator,
    idParamValidator
};