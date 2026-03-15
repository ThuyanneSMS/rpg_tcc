const db = require('../config/db');

// Atributos base das classes
const classStats = {
    Guerreiro: { attack: 10, defense: 15, health: 120, speed: 5 },
    Arqueiro: { attack: 12, defense: 8, health: 90, speed: 15 },
    Mago: { attack: 18, defense: 5, health: 80, speed: 8 },
};

exports.createCharacter = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, characterClass } = req.body;

        if (!name || !characterClass) {
            return res.status(400).json({ error: 'Nome e classe são obrigatórios.' });
        }

        if (!classStats[characterClass]) {
            return res.status(400).json({ error: 'Classe inválida. Escolha entre: Guerreiro, Arqueiro, Mago.' });
        }

        // Verifica se o usuário já possui um personagem
        const existingCharacter = await db.query('SELECT id FROM characters WHERE user_id = $1', [userId]);
        if (existingCharacter.rows.length > 0) {
            return res.status(409).json({ error: 'Você já possui um personagem.' });
        }

        const stats = classStats[characterClass];

        // Cria o personagem no banco
        const newCharacter = await db.query(
            `INSERT INTO characters 
            (user_id, name, class, base_attack, base_defense, base_health, base_speed, current_health) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *`,
            [userId, name, characterClass, stats.attack, stats.defense, stats.health, stats.speed, stats.health]
        );

        res.status(201).json({ message: 'Personagem criado com sucesso!', character: newCharacter.rows[0] });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao criar personagem.' });
    }
};

exports.getCharacter = async (req, res) => {
    try {
        const userId = req.user.id;

        const character = await db.query('SELECT * FROM characters WHERE user_id = $1', [userId]);
        
        if (character.rows.length === 0) {
            return res.status(404).json({ error: 'Nenhum personagem encontrado.' });
        }

        res.json({ character: character.rows[0] });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao buscar personagem.' });
    }
};
