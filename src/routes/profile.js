const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const apiLimiter = require('../middleware/rateLimiter');
const { updateProfileValidator, idParamValidator } = require('../middleware/profileValidators');

// GET /api/profile/me
router.get('/me', apiLimiter, auth, profileController.getMyProfile);

// PUT /api/profile/me
router.put('/me', apiLimiter, auth, updateProfileValidator, validate, profileController.updateMyProfile);

// Admin CRUD
router.get('/', apiLimiter, auth, profileController.getAllProfiles);
router.get('/:id', apiLimiter, auth, idParamValidator, validate, profileController.getProfileById);
router.put(
    '/:id',
    apiLimiter,
    auth,
    idParamValidator,
    validate,
    updateProfileValidator,
    validate,
    profileController.updateProfileById
);
router.delete('/:id', apiLimiter, auth, idParamValidator, validate, profileController.deleteProfileById);

module.exports = router;