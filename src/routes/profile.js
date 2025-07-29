const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

// Ottieni il profilo dell'utente loggato
router.get('/me', auth, profileController.getMyProfile);

// Aggiorna (o crea) il profilo dell'utente loggato
router.put('/me', auth, profileController.updateMyProfile);
// CRUD profili (admin)
router.get('/', auth, profileController.getAllProfiles); // Lista tutti i profili
router.get('/:id', auth, profileController.getProfileById); // Dettaglio singolo profilo
router.put('/:id', auth, profileController.updateProfileById); // Modifica profilo per id
router.delete('/:id', auth, profileController.deleteProfileById); // Elimina profilo per id

module.exports = router;