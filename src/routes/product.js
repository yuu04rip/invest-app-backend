const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');

// CRUD prodotti
router.post('/', auth, productController.createProduct);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', auth, productController.updateProductById);
router.delete('/:id', auth, productController.deleteProductById);

module.exports = router;