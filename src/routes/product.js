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
router.post('/', auth, apiLimiter,createProductValidator, validate, productController.createProduct);
router.get('/', productController.getAllProducts);
router.get('/:id', idParamValidator, validate, productController.getProductById);
router.put('/:id', auth,apiLimiter, idParamValidator, validate, updateProductValidator, validate, productController.updateProductById);
router.delete('/:id', auth, apiLimiter, idParamValidator, validate, productController.deleteProductById);

module.exports = router;