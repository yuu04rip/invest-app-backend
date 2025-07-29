const express = require('express');
const router = express.Router();
const albumController = require('../controllers/albumController');
const auth = require('../middleware/auth');

// CRUD album
router.post('/', auth, albumController.createAlbum);
router.get('/', albumController.getAllAlbums);
router.get('/:id', albumController.getAlbumById);
router.put('/:id', auth, albumController.updateAlbumById);
router.delete('/:id', auth, albumController.deleteAlbumById);

module.exports = router;