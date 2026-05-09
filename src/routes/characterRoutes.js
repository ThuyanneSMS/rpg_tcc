const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');
const authenticateToken = require('../middleware/auth');

// Rotas privadas (exigem token JWT)
router.post('/create', authenticateToken, characterController.createCharacter);
router.get('/', authenticateToken, characterController.getCharacter);
router.put('/gender', authenticateToken, characterController.updateGender);
router.put('/distribute-points', authenticateToken, characterController.distributePoints);
router.post('/heal', authenticateToken, characterController.healAtInn);

module.exports = router;
