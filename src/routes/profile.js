const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');
const { updateProfileValidator, idParamValidator } = require('../middleware/profileValidators');
const validate = require('../middleware/validate');

// Ottieni il profilo dell'utente loggato
router.get('/me', auth, profileController.getMyProfile);

// Aggiorna (o crea) il profilo dell'utente loggato
router.put('/me', auth, updateProfileValidator, validate, profileController.updateMyProfile);

// CRUD profili (admin)
router.get('/', auth, profileController.getAllProfiles);
router.get('/:id', auth, idParamValidator, validate, profileController.getProfileById);
router.put('/:id', auth, idParamValidator, validate, updateProfileValidator, validate, profileController.updateProfileById);
router.delete('/:id', auth, idParamValidator, validate, profileController.deleteProfileById);

module.exports = router;