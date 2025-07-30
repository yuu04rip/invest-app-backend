const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');
const { updateProfileValidator, idParamValidator } = require('../middleware/profileValidators');
const validate = require('../middleware/validate');
const apiLimiter = require('../middleware/rateLimiter');

// Ottieni il profilo dell'utente loggato
router.get('/me', apiLimiter, auth, profileController.getMyProfile);

// Aggiorna (o crea) il profilo dell'utente loggato
router.put('/me', apiLimiter, auth, updateProfileValidator, validate, profileController.updateMyProfile);

// CRUD profili (admin)
router.get('/', apiLimiter, auth, profileController.getAllProfiles);
router.get('/:id', apiLimiter, auth, idParamValidator, validate, profileController.getProfileById);
router.put('/:id', apiLimiter, auth, idParamValidator, validate, updateProfileValidator, validate, profileController.updateProfileById);
router.delete('/:id', apiLimiter, auth, idParamValidator, validate, profileController.deleteProfileById);

module.exports = router;