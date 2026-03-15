const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');
const authenticateToken = require('../middleware/auth');

// Rotas privadas (exigem token JWT)
router.post('/create', authenticateToken, characterController.createCharacter);
router.get('/', authenticateToken, characterController.getCharacter);

module.exports = router;
