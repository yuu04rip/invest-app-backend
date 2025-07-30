const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const apiLimiter = require('../middleware/rateLimiter');
const {
    createProductValidator,
    updateProductValidator,
    idParamValidator
} = require('../middleware/productValidators');

// CRUD prodotti
router.post(
    '/',
    apiLimiter, // PRIMA!
    auth,
    createProductValidator,
    validate,
    productController.createProduct
);

router.get('/', productController.getAllProducts);

router.get(
    '/:id',
    apiLimiter, // Anche qui se vuoi proteggere da flood su singolo prodotto!
    idParamValidator,
    validate,
    productController.getProductById
);

router.put(
    '/:id',
    apiLimiter,
    auth,
    idParamValidator,
    validate,
    updateProductValidator,
    validate,
    productController.updateProductById
);

router.delete(
    '/:id',
    apiLimiter,
    auth,
    idParamValidator,
    validate,
    productController.deleteProductById
);

module.exports = router;