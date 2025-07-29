const express = require('express');
const router = express.Router();
const albumAccessController = require('../controllers/albumAccessController');
const auth = require('../middleware/auth');

router.get('/:albumId', auth, albumAccessController.hasAlbumAccess);

module.exports = router;