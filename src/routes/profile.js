const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');
const { updateProfileValidator, idParamValidator } = require('../middleware/profileValidators');
const validate = require('../middleware/validate');
const apiLimiter = require('../middleware/rateLimiter');

// Ottieni il profilo dell'utente loggato
router.get('/me', auth, apiLimiter, profileController.getMyProfile);

// Aggiorna (o crea) il profilo dell'utente loggato
router.put('/me', auth,apiLimiter, updateProfileValidator, validate, profileController.updateMyProfile);

// CRUD profili (admin)
router.get('/', auth,apiLimiter, profileController.getAllProfiles);
router.get('/:id', auth,apiLimiter, idParamValidator, validate, profileController.getProfileById);
router.put('/:id', auth, apiLimiter,idParamValidator, validate, updateProfileValidator, validate, profileController.updateProfileById);
router.delete('/:id', auth,apiLimiter, idParamValidator, validate, profileController.deleteProfileById);

module.exports = router;