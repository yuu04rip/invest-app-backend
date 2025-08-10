const { body, param } = require('express-validator');

const updateProfileValidator = [
    body('name')
        .exists().withMessage('Il nome è obbligatorio')
        .bail()
        .isString().withMessage('Il nome deve essere una stringa')
        .bail()
        .notEmpty().withMessage('Il nome non può essere vuoto')
        .bail()
        .trim(),

    body('surname')
        .exists().withMessage('Il cognome è obbligatorio')
        .bail()
        .isString().withMessage('Il cognome deve essere una stringa')
        .bail()
        .notEmpty().withMessage('Il cognome non può essere vuoto')
        .bail()
        .trim(),

    body('bio')
        .optional({ nullable: true })
        .isString().withMessage('La bio deve essere una stringa')
        .bail()
        .trim(),

    body('sector')
        .optional({ nullable: true })
        .isString().withMessage('Il settore deve essere una stringa')
        .bail()
        .trim(),

    body('interests')
        .optional({ nullable: true })
        .isString().withMessage('Gli interessi devono essere una stringa')
        .bail()
        .trim(),
];

// Se l'ID è UUID nel tuo schema Prisma, valida come UUID:
const idParamValidator = [
    param('id').isUUID().withMessage('ID non valido (deve essere UUID)'),
];

module.exports = {
    updateProfileValidator,
    idParamValidator,
};