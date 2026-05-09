const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/rankingController');
const authenticateToken = require('../middleware/auth');

// Público — qualquer um pode ver o ranking e o hall of fame
router.get('/current',      rankingController.getCurrentRanking);
router.get('/hall-of-fame', rankingController.getHallOfFame);

// Privado — conquistas do personagem autenticado
router.get('/achievements', authenticateToken, rankingController.getMyAchievements);

module.exports = router;
