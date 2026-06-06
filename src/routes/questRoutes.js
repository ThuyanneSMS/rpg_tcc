const express = require('express');
const router = express.Router();
const questController = require('../controllers/questController');
const authenticateToken = require('../middleware/auth');

// Todas as rotas exigem autenticação
router.get('/', authenticateToken, questController.getDailyQuests);
router.post('/claim', authenticateToken, questController.claimQuest);

module.exports = router;
