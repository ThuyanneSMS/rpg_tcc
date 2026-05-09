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

// Estalagem: recuperar HP completo gastando ouro
exports.healAtInn = async (req, res) => {
    try {
        const userId = req.user.id;

        const charResult = await db.query(
            'SELECT id, level, current_health, base_health, gold FROM characters WHERE user_id = $1',
            [userId]
        );

        if (charResult.rows.length === 0) {
            return res.status(404).json({ error: 'Personagem não encontrado.' });
        }

        const char = charResult.rows[0];
        const missingHp = char.base_health - char.current_health;

        if (missingHp <= 0) {
            return res.status(400).json({ error: 'Seu personagem já está com a vida cheia!' });
        }

        // Custo: 0.05 de ouro por HP faltando + nível (mínimo 2 de ouro)
        const cost = Math.max(2, Math.ceil(missingHp * 0.05 + char.level));

        if (char.gold < cost) {
            return res.status(400).json({
                error: `Ouro insuficiente! A estalagem cobra ${cost} de ouro para curar ${missingHp} HP. Você possui apenas ${char.gold} de ouro.`
            });
        }

        const result = await db.query(
            `UPDATE characters
             SET current_health = base_health, gold = gold - $1
             WHERE user_id = $2
             RETURNING current_health, base_health, gold`,
            [cost, userId]
        );

        const updated = result.rows[0];

        res.json({
            message: `❤️ Você descansou na Estalagem e recuperou ${missingHp} HP por ${cost} de ouro!`,
            currentHealth: updated.current_health,
            maxHealth: updated.base_health,
            gold: updated.gold,
            cost,
            healed: missingHp
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao usar a Estalagem.' });
    }
};

// Distribuir pontos livres nos atributos do personagem
exports.distributePoints = async (req, res) => {
    try {
        const userId = req.user.id;
        const { stat, points } = req.body;

        const validStats = ['attack', 'defense', 'speed', 'health'];
        if (!validStats.includes(stat)) {
            return res.status(400).json({ error: 'Atributo inválido. Escolha: attack, defense, speed ou health.' });
        }

        const amount = parseInt(points);
        if (!amount || amount < 1 || amount > 10) {
            return res.status(400).json({ error: 'Quantidade de pontos inválida (mínimo 1, máximo 10 por vez).' });
        }

        // Buscar personagem e verificar se tem pontos suficientes
        const charResult = await db.query(
            'SELECT id, unassigned_points FROM characters WHERE user_id = $1',
            [userId]
        );

        if (charResult.rows.length === 0) {
            return res.status(404).json({ error: 'Personagem não encontrado.' });
        }

        const char = charResult.rows[0];

        if (char.unassigned_points < amount) {
            return res.status(400).json({ error: `Pontos insuficientes. Você possui apenas ${char.unassigned_points} ponto(s) livre(s).` });
        }

        // Mapeamento de stat para coluna do banco
        const statColumnMap = {
            attack: 'base_attack',
            defense: 'base_defense',
            speed: 'base_speed',
            health: 'base_health',
        };

        // Valor adicionado por ponto investido
        const statGainMap = {
            attack: 2,
            defense: 2,
            speed: 1,
            health: 5,
        };

        const column = statColumnMap[stat];
        const gain = statGainMap[stat] * amount;

        // Atualizar atributo e descontar pontos; se for health, também atualiza current_health
        let updateQuery;
        if (stat === 'health') {
            updateQuery = await db.query(
                `UPDATE characters 
                 SET ${column} = ${column} + $1, 
                     current_health = current_health + $1,
                     unassigned_points = unassigned_points - $2
                 WHERE user_id = $3
                 RETURNING base_attack, base_defense, base_speed, base_health, current_health, unassigned_points`,
                [gain, amount, userId]
            );
        } else {
            updateQuery = await db.query(
                `UPDATE characters 
                 SET ${column} = ${column} + $1, 
                     unassigned_points = unassigned_points - $2
                 WHERE user_id = $3
                 RETURNING base_attack, base_defense, base_speed, base_health, current_health, unassigned_points`,
                [gain, amount, userId]
            );
        }

        const statLabels = { attack: 'Ataque', defense: 'Defesa', speed: 'Velocidade', health: 'Vida' };

        res.json({
            message: `+${gain} em ${statLabels[stat]}! ${amount} ponto(s) utilizado(s).`,
            character: updateQuery.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao distribuir pontos.' });
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
