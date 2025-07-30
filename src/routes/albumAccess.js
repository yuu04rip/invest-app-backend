const express = require('express');
const router = express.Router();
const albumAccessController = require('../controllers/albumAccessController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { albumIdParamValidator } = require('../middleware/albumAccessValidators');

router.get('/:albumId', auth, albumIdParamValidator, validate, albumAccessController.hasAlbumAccess);

module.exports = router;