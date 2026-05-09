const db = require('../config/db');

/**
 * Verifica e desbloqueia conquistas para um personagem após uma vitória.
 * Retorna array de conquistas recém-desbloqueadas (para exibir no frontend).
 */
async function checkAndUnlockAchievements(character) {
    const newlyUnlocked = [];

    // Condições: [key_da_conquista, fn de verificação]
    const conditions = [
        ['first_win',     () => character.total_wins >= 1],
        ['warrior_10',    () => character.total_wins >= 10],
        ['warrior_50',    () => character.total_wins >= 50],
        ['warrior_100',   () => character.total_wins >= 100],
        ['level_5',       () => character.level >= 5],
        ['level_10',      () => character.level >= 10],
        ['gold_1000',     () => character.gold >= 1000],
        ['gold_10000',    () => character.gold >= 10000],
        ['dragon_slayer', () => character.last_monster === 'Mini Dragão'],
    ];

    for (const [key, check] of conditions) {
        if (!check()) continue;

        // Busca o achievement pelo key
        const achRes = await db.query('SELECT id, name, badge_icon FROM achievements WHERE key = $1', [key]);
        if (achRes.rows.length === 0) continue;
        const achievement = achRes.rows[0];

        // Tenta inserir (UNIQUE constraint impede duplicatas)
        const insertRes = await db.query(
            `INSERT INTO character_achievements (character_id, achievement_id)
             VALUES ($1, $2)
             ON CONFLICT (character_id, achievement_id) DO NOTHING
             RETURNING id`,
            [character.id, achievement.id]
        );

        if (insertRes.rows.length > 0) {
            // Foi inserido = conquista recém desbloqueada
            newlyUnlocked.push({ name: achievement.name, icon: achievement.badge_icon });
        }
    }

    return newlyUnlocked;
}

module.exports = { checkAndUnlockAchievements };
