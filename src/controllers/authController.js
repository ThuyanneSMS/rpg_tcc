const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Registrar novo usuário
exports.register = async (req, res) => {
    try {
        const { full_name, nickname, age, gender, email, password, country } = req.body;

        // Validar e-mail e senha
        if (!email || !password || password.length < 8) {
            return res.status(400).json({ error: 'E-mail inválido ou senha com menos de 8 caracteres.' });
        }

        // Verifica se usuário (email ou nickname) já existe
        const userExists = await db.query('SELECT id FROM users WHERE email = $1 OR nickname = $2', [email, nickname]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ error: 'E-mail ou Apelido já cadastrados.' });
        }

        // Criptografar senha
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Inserir usuário
        const newUser = await db.query(
            'INSERT INTO users (full_name, nickname, age, gender, email, password_hash, country) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, full_name, nickname, email',
            [full_name, nickname, age, gender, email, passwordHash, country]
        );

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!', user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor durante o cadastro.' });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuário pelo e-mail
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
        }

        const user = userResult.rows[0];

        // Verificar senha
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
        }

        // Gerar Token JWT
        const token = jwt.sign(
            { id: user.id, nickname: user.nickname },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ message: 'Login realizado com sucesso!', token });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor durante o login.' });
    }
};

// Alteração de dados do usuário (Exige Token JWT)
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Vinculado no Middleware de Autenticação
        const { full_name, age, gender, country } = req.body;

        const updatedUser = await db.query(
            'UPDATE users SET full_name = COALESCE($1, full_name), age = COALESCE($2, age), gender = COALESCE($3, gender), country = COALESCE($4, country) WHERE id = $5 RETURNING id, full_name, nickname, age, gender, country',
            [full_name, age, gender, country, userId]
        );

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        res.json({ message: 'Dados atualizados com sucesso!', user: updatedUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao atualizar perfil.' });
    }
};

// Obter dados do jogador atual
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const userResult = await db.query(
            'SELECT id, full_name, nickname, email, age, gender, country, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        res.json({ user: userResult.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao buscar perfil do usuário.' });
    }
};
