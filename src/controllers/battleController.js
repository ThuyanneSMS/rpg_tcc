const db = require('../config/db');
const { checkLevelUp } = require('../utils/gameLogic');

// Lista de monstros disponíveis
const monsters = [
    { name: 'Lobo', hp: 30, max_hp: 30, attack: 8, defense: 2, gold: 5, xp: 20 },
    { name: 'Esqueleto', hp: 50, max_hp: 50, attack: 12, defense: 5, gold: 10, xp: 40 },
    { name: 'Zumbi', hp: 70, max_hp: 70, attack: 10, defense: 8, gold: 15, xp: 50 },
    { name: 'Mini Dragão', hp: 150, max_hp: 150, attack: 25, defense: 15, gold: 50, xp: 120 }
];

// Iniciar uma batalha aleatória
exports.startBattle = async (req, res) => {
    try {
        const userId = req.user.id;

        // Pega o personagem
        const characterRes = await db.query('SELECT * FROM characters WHERE user_id = $1', [userId]);
        if (characterRes.rows.length === 0) return res.status(404).json({ error: 'Personagem não encontrado.' });
        const character = characterRes.rows[0];

        // Verifica se já existe uma batalha
        const activeBattle = await db.query('SELECT * FROM active_battles WHERE character_id = $1', [character.id]);
        if (activeBattle.rows.length > 0) {
            return res.json({ message: 'Você já está em batalha!', battle: activeBattle.rows[0] });
        }

        // Escolhe o monstro
        const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];

        // Insere a batalha ativa
        await db.query(
            `INSERT INTO active_battles 
            (character_id, monster_name, monster_hp, monster_max_hp, monster_attack, monster_defense, monster_gold, monster_xp) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [character.id, randomMonster.name, randomMonster.hp, randomMonster.max_hp, randomMonster.attack, randomMonster.defense, randomMonster.gold, randomMonster.xp]
        );

        res.json({ message: 'Um monstro apareceu!', monster: randomMonster });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao iniciar batalha.' });
    }
};

// Realizar uma ação (Atacar, Defender, Poção, Fugir)
exports.battleAction = async (req, res) => {
    try {
        const userId = req.user.id;
        const { action } = req.body; // 'attack', 'defend', 'potion', 'flee'

        const characterRes = await db.query('SELECT * FROM characters WHERE user_id = $1', [userId]);
        if (characterRes.rows.length === 0) return res.status(404).json({ error: 'Personagem não encontrado.' });
        const character = characterRes.rows[0];

        const battleRes = await db.query('SELECT * FROM active_battles WHERE character_id = $1', [character.id]);
        if (battleRes.rows.length === 0) return res.status(400).json({ error: 'Nenhuma batalha ativa.' });
        let battle = battleRes.rows[0];

        // --- Atributos Dinâmicos Baseados no Inventário ---
        // Calcula ataque e defesa adicionando bônus dos itens equipados
        const equippedItems = await db.query('SELECT item_type, stat_bonus FROM inventory WHERE character_id = $1 AND is_equipped = true', [character.id]);
        let totalAttack = character.base_attack;
        let totalDefense = character.base_defense;

        for (let item of equippedItems.rows) {
            if (item.item_type === 'sword') totalAttack += item.stat_bonus; // Espada = +Ataque
            else if (item.item_type === 'shield') totalDefense += item.stat_bonus; // Escudo = +Defesa
        }

        // Resposta base da rodada
        const roundLog = [];

        // Trata FUGIR
        if (action === 'flee') {
            await db.query('DELETE FROM active_battles WHERE character_id = $1', [character.id]);
            return res.json({ message: 'Você fugiu da batalha com sucesso!', log: ['Você escapou em segurança.'] });
        }

        // O monstro SEMPRE vai agir depois da sua ação (exceto se você curou ou matou)
        let playerDamageDealt = 0;
        let isDefendingTemporarily = false;

        if (action === 'attack') {
            playerDamageDealt = totalAttack - battle.monster_defense;
            if (playerDamageDealt < 1) playerDamageDealt = 1;

            battle.monster_hp -= playerDamageDealt;
            roundLog.push(`Você atacou o ${battle.monster_name} causando ${playerDamageDealt} de dano!`);

        } else if (action === 'defend') {
            isDefendingTemporarily = true;
            roundLog.push(`Você assumiu posição de defesa. O dano inimigo será reduzido.`);
        } else if (action === 'potion') {
            const potionRes = await db.query('SELECT * FROM inventory WHERE character_id = $1 AND item_type = $2 AND quantity > 0', [character.id, 'potion']);
            if (potionRes.rows.length > 0) {
                // Remove 1, cura HP (Ajuste isso depois quando implementar inventário real)
                await db.query('UPDATE inventory SET quantity = quantity - 1 WHERE id = $1', [potionRes.rows[0].id]);
                character.current_health += 50; 
                if (character.current_health > character.base_health) character.current_health = character.base_health;
                
                // Salvar a vida logo ao curar para ter consistência se der erro:
                await db.query('UPDATE characters SET current_health = $1 WHERE id = $2', [character.current_health, character.id]);
                
                roundLog.push(`Você usou uma poção e recuperou 50 pontos de vida.`);
            } else {
                roundLog.push(`Você não possui poções! Perdeu o turno.`);
            }
        }

        // Se o Monstro MORREU nesta rodada
        if (battle.monster_hp <= 0) {
            await db.query('DELETE FROM active_battles WHERE character_id = $1', [character.id]);
            
            // Adicionar Experiência e Ouro
            character.experience += battle.monster_xp;
            character.gold += battle.monster_gold;
            roundLog.push(`O ${battle.monster_name} foi derrotado!`);
            roundLog.push(`Você ganhou ${battle.monster_xp} XP e ${battle.monster_gold} de Ouro!`);

            // Check LeveUp
            const levelUp = checkLevelUp(character);
            if (levelUp.leveledUp) {
                character.level = levelUp.newLevel;
                character.base_attack += levelUp.attackBonus;
                character.base_defense += levelUp.defenseBonus;
                character.base_health += levelUp.healthBonus;
                character.current_health = character.base_health; // Full heal by leveling up
                character.unassigned_points += levelUp.pointsBonus;
                roundLog.push(`PARABÉNS! Você subiu para o Nível ${character.level}! Recebeu atributos extras e pontos para distribuir.`);
            }

            // Atualiza Char no banco
            await db.query(
                'UPDATE characters SET experience = $1, gold = $2, level = $3, base_attack = $4, base_defense = $5, base_health = $6, unassigned_points = $7, current_health = $8 WHERE id = $9',
                [character.experience, character.gold, character.level, character.base_attack, character.base_defense, character.base_health, character.unassigned_points, character.current_health, character.id]
            );

            return res.json({ message: 'Vitória!', log: roundLog, character, battleStatus: 'ended' });
        }

        // Se ainda tá vivo, Monstro ATACA
        let defenseValue = totalDefense;
        if (isDefendingTemporarily) {
            defenseValue *= 2; // Dobra a defesa ao defender
        }

        let monsterDamage = battle.monster_attack - defenseValue;
        if (monsterDamage < 1) monsterDamage = 1;

        character.current_health -= monsterDamage;
        roundLog.push(`O ${battle.monster_name} atacou! Você recebeu ${monsterDamage} de dano.`);

        // Se o Jogador Morreu
        if (character.current_health <= 0) {
            await db.query('DELETE FROM active_battles WHERE character_id = $1', [character.id]);
            
            // Punição de morte: Volta para a cidade, perde um pouco de XP ou apenas é recarregado. O HP volta pra 10.
            await db.query('UPDATE characters SET current_health = 10, experience = GREATEST(0, experience - 10) WHERE id = $1', [character.id]);
            roundLog.push(`Você foi derrotado pelo ${battle.monster_name}... Perdeu 10 XP.`);

            return res.json({ message: 'Derrota!', log: roundLog, battleStatus: 'ended_defeat' });
        }

        // Se o combate ainda continua, salva HP de ambos
        await db.query('UPDATE active_battles SET monster_hp = $1 WHERE character_id = $2', [battle.monster_hp, character.id]);
        await db.query('UPDATE characters SET current_health = $1 WHERE id = $2', [character.current_health, character.id]);

        return res.json({
            message: 'Rodada concluída.',
            log: roundLog,
            battleStatus: 'ongoing',
            playerHealth: character.current_health,
            monsterHealth: battle.monster_hp
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao executar ação na batalha.' });
    }
};