const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const authenticateToken = require('../middleware/auth');

// Rotas da Loja (Requerem autenticação para saber quem está comprando)
router.get('/items', authenticateToken, shopController.getShopItems);
router.post('/buy', authenticateToken, shopController.buyItem);

module.exports = router;