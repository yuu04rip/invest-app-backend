const express = require('express');
const router = express.Router();
const albumController = require('../controllers/albumController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
    createAlbumValidator,
    updateAlbumValidator,
    idParamValidator
} = require('../middleware/albumValidators');
const apiLimiter = require('../middleware/rateLimiter');

// Crea nuovo album
router.post('/', auth, apiLimiter, createAlbumValidator, validate, albumController.createAlbum);

// Lista album (pubblico o autenticato, come preferisci)
router.get('/', albumController.getAllAlbums);

// Dettaglio album
router.get('/:id', idParamValidator, validate, albumController.getAlbumById);

// Modifica album
router.put('/:id', auth, apiLimiter, idParamValidator, validate, updateAlbumValidator, validate, albumController.updateAlbumById);

// Elimina albu
router.delete('/:id', auth, apiLimiter, idParamValidator, validate, albumController.deleteAlbumById);

module.exports = router;