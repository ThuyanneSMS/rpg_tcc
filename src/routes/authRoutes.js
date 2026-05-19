const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');

// Rotas públicas (abertas)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rotas privadas (exigem token JWT)
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

// Theme routes
router.get('/theme', authenticateToken, authController.getTheme);
router.put('/theme', authenticateToken, authController.updateTheme);

module.exports = router;
