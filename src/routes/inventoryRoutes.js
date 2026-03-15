const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authenticateToken = require('../middleware/auth');

// Rotas do Inventário
router.get('/', authenticateToken, inventoryController.getInventory);    
router.post('/equip', authenticateToken, inventoryController.toggleEquip);
router.post('/use', authenticateToken, inventoryController.useItemOutBattle);

module.exports = router;