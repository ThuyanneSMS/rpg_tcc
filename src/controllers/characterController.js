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
        const { name, characterClass, gender } = req.body;

        if (!name || !characterClass) {
            return res.status(400).json({ error: 'Nome e classe são obrigatórios.' });
        }

        if (!classStats[characterClass]) {
            return res.status(400).json({ error: 'Classe inválida. Escolha entre: Guerreiro, Arqueiro, Mago.' });
        }

        const charGender = gender === 'Feminino' ? 'Feminino' : 'Masculino';

        // Verifica se o usuário já possui um personagem
        const existingCharacter = await db.query('SELECT id FROM characters WHERE user_id = $1', [userId]);
        if (existingCharacter.rows.length > 0) {
            return res.status(409).json({ error: 'Você já possui um personagem.' });
        }

        const stats = classStats[characterClass];

        // Cria o personagem no banco
        const newCharacter = await db.query(
            `INSERT INTO characters 
            (user_id, name, class, gender, base_attack, base_defense, base_health, base_speed, current_health) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *`,
            [userId, name, characterClass, charGender, stats.attack, stats.defense, stats.health, stats.speed, stats.health]
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

        const char = character.rows[0];

        // Buscar equipamentos equipados e somar bônus
        const equippedRes = await db.query(
            'SELECT equipment_slot, stat_bonus FROM inventory WHERE character_id = $1 AND is_equipped = true AND equipment_slot IS NOT NULL',
            [char.id]
        );

        let bonusAttack = 0;
        let bonusDefense = 0;
        let bonusSpeed = 0;

        equippedRes.rows.forEach(eq => {
            const slot = eq.equipment_slot;
            const bonus = eq.stat_bonus || 0;
            // Armas, luvas e anéis dão ataque
            if (slot === 'weapon' || slot === 'gloves' || slot === 'ring') {
                bonusAttack += bonus;
            }
            // Capacete, peitoral, escudo e colar dão defesa
            else if (slot === 'helmet' || slot === 'chest' || slot === 'shield' || slot === 'necklace') {
                bonusDefense += bonus;
            }
            // Botas dão velocidade
            else if (slot === 'boots') {
                bonusSpeed += bonus;
            }
        });

        // Retornar stats base + bônus
        char.total_attack = char.base_attack + bonusAttack;
        char.total_defense = char.base_defense + bonusDefense;
        char.total_speed = char.base_speed + bonusSpeed;
        char.bonus_attack = bonusAttack;
        char.bonus_defense = bonusDefense;
        char.bonus_speed = bonusSpeed;

        res.json({ character: char });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor ao buscar personagem.' });
    }
};

// Trocar gênero/aparência do personagem
exports.updateGender = async (req, res) => {
    try {
        const userId = req.user.id;
        const { gender } = req.body;

        if (gender !== 'Masculino' && gender !== 'Feminino') {
            return res.status(400).json({ error: 'Gênero inválido. Escolha Masculino ou Feminino.' });
        }

        const result = await db.query(
            'UPDATE characters SET gender = $1 WHERE user_id = $2 RETURNING gender',
            [gender, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Personagem não encontrado.' });
        }

        res.json({ message: `Aparência alterada para ${gender}!`, gender: result.rows[0].gender });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao atualizar aparência.' });
    }
};
