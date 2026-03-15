const express = require('express');
const router = express.Router();
const battleController = require('../controllers/battleController');
const authenticateToken = require('../middleware/auth');

// Rotas privadas (exigem token JWT)
router.post('/start', authenticateToken, battleController.startBattle);
router.post('/action', authenticateToken, battleController.battleAction);

module.exports = router;
