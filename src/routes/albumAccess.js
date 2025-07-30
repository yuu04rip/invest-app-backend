const express = require('express');
const router = express.Router();
const albumAccessController = require('../controllers/albumAccessController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { albumIdParamValidator } = require('../middleware/albumAccessValidators');
const apiLimiter = require('../middleware/rateLimiter');

router.get(
    '/:albumId',
    apiLimiter,
    auth,
    albumIdParamValidator,
    validate,
    albumAccessController.hasAlbumAccess
);

module.exports = router;