const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do Frontend
app.use(express.static(path.join(__dirname, '../public')));

// Main Routes
const authRoutes = require('./routes/authRoutes');
const characterRoutes = require('./routes/characterRoutes');
const battleRoutes = require('./routes/battleRoutes');
const shopRoutes = require('./routes/shopRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const rankingRoutes = require('./routes/rankingRoutes');

// Uso das rotas principais
app.use('/api/auth', authRoutes);
app.use('/api/character', characterRoutes);
app.use('/api/battle', battleRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/ranking', rankingRoutes);

// Rota raiz (Verificação simples)
app.get('/', (req, res) => {
    res.send('A API do RPG Web está rodando!');
});

// Cron job: encerra a temporada todo dia 1 do mês à meia-noite
const cron = require('node-cron');
const { closeSeasonAndReset } = require('./controllers/rankingController');
cron.schedule('0 0 1 * *', () => {
    console.log('[CRON] Iniciando encerramento de temporada...');
    closeSeasonAndReset();
});

// Inicialização do Servidor
app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});
