const { param } = require('express-validator');

const albumIdParamValidator = [
    param('albumId')
        .notEmpty()
        .withMessage('albumId obbligatorio')
        .isString()
        .withMessage('albumId deve essere una stringa')
    // Se usi UUID:
    //.isUUID().withMessage('albumId deve essere un UUID')
];

module.exports = {
    albumIdParamValidator
};