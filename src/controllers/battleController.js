const db = require('../config/db');
const { checkLevelUp, calcDamage } = require('../utils/gameLogic');
const { checkAndUnlockAchievements } = require('../utils/achievements');
const { getQuestByKey } = require('../utils/quests');

/**
 * Atualiza o progresso das missões diárias após uma vitória em batalha.
 * @param {number} characterId
 * @param {string} monsterName  — nome do monstro derrotado
 * @param {number} goldEarned   — ouro ganho na batalha
 */
async function updateQuestProgress(characterId, monsterName, goldEarned) {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const rows = await db.query(
            `SELECT * FROM character_daily_quests
             WHERE character_id = $1 AND quest_date = $2 AND completed = false`,
            [characterId, today]
        );
        for (const row of rows.rows) {
            const meta = getQuestByKey(row.quest_key);
            if (!meta) continue;
            let newProgress = row.progress;
            if (meta.type === 'kill') {
                newProgress += 1;
            } else if (meta.type === 'earn_gold') {
                newProgress += goldEarned;
            } else if (meta.type === 'kill_boss' && meta.boss_name === monsterName) {
                newProgress += 1;
            }
            if (newProgress !== row.progress) {
                const isDone = newProgress >= meta.target;
                await db.query(
                    `UPDATE character_daily_quests
                     SET progress = $1, completed = $2
                     WHERE id = $3`,
                    [Math.min(newProgress, meta.target), isDone, row.id]
                );
            }
        }
    } catch (err) {
        // Não interrompe o fluxo principal em caso de erro nas missões
        console.error('Erro ao atualizar progresso de missões:', err.message);
    }
}

// =============================================================
// POOL DE MONSTROS POR TIER (calibrados para os stats dos heróis)
// Heróis começam com: Guerreiro atk=10/def=15/hp=120
//                      Arqueiro atk=12/def=8/hp=90
//                      Mago     atk=18/def=5/hp=80
// Fórmula de dano: attack * (100 / (100 + defense)) ±15%
// =============================================================
const monsterTiers = [
    // Tier 1 — Nível 1-2 (fácil, ~4-6 hits para matar e ser morto)
    [
        { name: 'Rato de Caverna', hp: 28,  max_hp: 28,  attack: 7,  defense: 1,  gold: 3,  xp: 18  },
        { name: 'Lobo',            hp: 42,  max_hp: 42,  attack: 10, defense: 3,  gold: 6,  xp: 28  },
        { name: 'Goblin',          hp: 38,  max_hp: 38,  attack: 9,  defense: 2,  gold: 8,  xp: 22  },
    ],
    // Tier 2 — Nível 2-3 (moderado)
    [
        { name: 'Esqueleto',       hp: 65,  max_hp: 65,  attack: 14, defense: 6,  gold: 12, xp: 48  },
        { name: 'Zumbi',           hp: 85,  max_hp: 85,  attack: 12, defense: 10, gold: 15, xp: 55  },
        { name: 'Bandido',         hp: 58,  max_hp: 58,  attack: 16, defense: 4,  gold: 20, xp: 60  },
    ],
    // Tier 3 — Nível 3-4 (desafiador)
    [
        { name: 'Orc Guerreiro',   hp: 110, max_hp: 110, attack: 20, defense: 13, gold: 28, xp: 90  },
        { name: 'Lobisomem',       hp: 95,  max_hp: 95,  attack: 24, defense: 8,  gold: 32, xp: 100 },
        { name: 'Espectro',        hp: 80,  max_hp: 80,  attack: 22, defense: 6,  gold: 35, xp: 95  },
    ],
    // Tier 4 — Nível 4-5 (difícil)
    [
        { name: 'Troll',           hp: 140, max_hp: 140, attack: 26, defense: 20, gold: 45, xp: 135 },
        { name: 'Vampiro',         hp: 115, max_hp: 115, attack: 30, defense: 13, gold: 50, xp: 145 },
        { name: 'Golem de Barro',  hp: 160, max_hp: 160, attack: 22, defense: 25, gold: 40, xp: 125 },
    ],
    // Tier 5 — Nível 5+ (boss-like)
    [
        { name: 'Mini Dragão',     hp: 185, max_hp: 185, attack: 36, defense: 22, gold: 85, xp: 210 },
        { name: 'Golem de Pedra',  hp: 230, max_hp: 230, attack: 28, defense: 32, gold: 75, xp: 190 },
        { name: 'Necromante',      hp: 155, max_hp: 155, attack: 42, defense: 14, gold: 100, xp: 230 },
    ],
];

/**
 * Seleciona monstros compatíveis com o nível do herói.
 * Níveis 1-2 → tier 0 | 2-3 → tiers 0-1 | 3-4 → tiers 1-2
 * 4-5 → tiers 2-3 | 5-7 → tiers 3-4 | 7+ → tier 4
 */
function getMonsterPool(heroLevel) {
    if (heroLevel <= 1) return monsterTiers[0];
    if (heroLevel === 2) return [...monsterTiers[0], ...monsterTiers[1]];
    if (heroLevel === 3) return [...monsterTiers[1], ...monsterTiers[2]];
    if (heroLevel === 4) return [...monsterTiers[2], ...monsterTiers[3]];
    if (heroLevel <= 6)  return [...monsterTiers[3], ...monsterTiers[4]];
    return monsterTiers[4];
}

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
            const b = activeBattle.rows[0];
            return res.json({
                message: 'Você já está em batalha!',
                player: { name: character.name, hp: character.current_health, max_hp: character.base_health },
                monster: { name: b.monster_name, hp: b.monster_hp, max_hp: b.monster_max_hp }
            });
        }

        // Escolhe o monstro compatível com o nível do herói
        const pool = getMonsterPool(character.level);
        const randomMonster = pool[Math.floor(Math.random() * pool.length)];
        // Clonar para não mutar o objeto original
        const monster = { ...randomMonster };

        // Insere a batalha ativa
        await db.query(
            `INSERT INTO active_battles 
            (character_id, monster_name, monster_hp, monster_max_hp, monster_attack, monster_defense, monster_gold, monster_xp) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [character.id, monster.name, monster.hp, monster.max_hp, monster.attack, monster.defense, monster.gold, monster.xp]
        );

        res.json({
            message: 'Um monstro apareceu!',
            player: { name: character.name, hp: character.current_health, max_hp: character.base_health },
            monster
        });
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
        // Calcula ataque, defesa e velocidade adicionando bônus dos itens equipados
        const equippedItems = await db.query(
            'SELECT equipment_slot, stat_bonus FROM inventory WHERE character_id = $1 AND is_equipped = true AND equipment_slot IS NOT NULL',
            [character.id]
        );
        let totalAttack = character.base_attack;
        let totalDefense = character.base_defense;

        for (let item of equippedItems.rows) {
            const slot = item.equipment_slot;
            const bonus = item.stat_bonus || 0;
            if (slot === 'weapon' || slot === 'gloves' || slot === 'ring') {
                totalAttack += bonus;
            } else if (slot === 'helmet' || slot === 'chest' || slot === 'shield' || slot === 'necklace') {
                totalDefense += bonus;
            }
        }

        // Resposta base da rodada
        const roundLog = [];

        // Trata FUGIR
        if (action === 'flee') {
            await db.query('DELETE FROM active_battles WHERE character_id = $1', [character.id]);
            return res.json({ status: 'fled', log: ['Você escapou em segurança.'] });
        }

        // O monstro SEMPRE vai agir depois da sua ação (exceto se você curou ou matou)
        let playerDamageDealt = 0;
        let isDefendingTemporarily = false;

        if (action === 'attack') {
            playerDamageDealt = calcDamage(totalAttack, battle.monster_defense);
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

            // Incrementar total de vitórias
            character.total_wins = (character.total_wins || 0) + 1;
            character.last_monster = battle.monster_name;

            // Atualiza Char no banco
            await db.query(
                'UPDATE characters SET experience = $1, gold = $2, level = $3, base_attack = $4, base_defense = $5, base_health = $6, unassigned_points = $7, current_health = $8, total_wins = $9 WHERE id = $10',
                [character.experience, character.gold, character.level, character.base_attack, character.base_defense, character.base_health, character.unassigned_points, character.current_health, character.total_wins, character.id]
            );

            // Verificar conquistas desbloqueadas
            const unlockedAchievements = await checkAndUnlockAchievements(character);

            // Atualizar progresso das missões diárias
            await updateQuestProgress(character.id, battle.monster_name, battle.monster_gold);

            return res.json({
                status: 'won',
                log: roundLog,
                rewards: {
                    exp: battle.monster_xp,
                    gold: battle.monster_gold,
                    leveledUp: levelUp.leveledUp,
                    newLevel: character.level
                },
                newAchievements: unlockedAchievements
            });
        }

        // Se ainda tá vivo, Monstro ATACA
        let monsterDamage = calcDamage(battle.monster_attack, isDefendingTemporarily ? totalDefense * 2 : totalDefense);
        character.current_health -= monsterDamage;
        roundLog.push(`O ${battle.monster_name} atacou! Você recebeu ${monsterDamage} de dano.`);

        // Se o Jogador Morreu
        if (character.current_health <= 0) {
            await db.query('DELETE FROM active_battles WHERE character_id = $1', [character.id]);
            
            // Punição de morte: Volta para a cidade, perde um pouco de XP ou apenas é recarregado. O HP volta pra 10.
            await db.query('UPDATE characters SET current_health = 10, experience = GREATEST(0, experience - 10) WHERE id = $1', [character.id]);
            roundLog.push(`Você foi derrotado pelo ${battle.monster_name}... Perdeu 10 XP.`);

            return res.json({ status: 'lost', log: roundLog });
        }

        // Se o combate ainda continua, salva HP de ambos
        await db.query('UPDATE active_battles SET monster_hp = $1 WHERE character_id = $2', [battle.monster_hp, character.id]);
        await db.query('UPDATE characters SET current_health = $1 WHERE id = $2', [character.current_health, character.id]);

        return res.json({
            status: 'ongoing',
            log: roundLog,
            state: {
                playerHp: character.current_health,
                monsterHp: battle.monster_hp
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao executar ação na batalha.' });
    }
};