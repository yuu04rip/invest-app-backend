const { body, param } = require('express-validator');

const updateProfileValidator = [
    body('name')
        .notEmpty()
        .withMessage('Il nome è obbligatorio'),
    body('surname')
        .notEmpty()
        .withMessage('Il cognome è obbligatorio'),
    body('bio')
        .optional()
        .isString()
        .withMessage('La bio deve essere una stringa'),
    body('sector')
        .optional()
        .isString()
        .withMessage('Il settore deve essere una stringa'),
    body('interests')
        .optional()
        .isString()
        .withMessage('Gli interessi devono essere una stringa'),
];

const idParamValidator = [
    param('id')
        .isString()
        .withMessage('ID non valido')
];

module.exports = {
    updateProfileValidator,
    idParamValidator
};