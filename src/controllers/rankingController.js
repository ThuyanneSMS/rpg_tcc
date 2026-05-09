const db = require('../config/db');

// GET /ranking/current — ranking da temporada ativa (top 20)
exports.getCurrentRanking = async (req, res) => {
    try {
        const ranking = await db.query(`
            SELECT
                ROW_NUMBER() OVER (ORDER BY c.total_wins DESC, c.level DESC, c.gold DESC) AS position,
                c.name   AS character_name,
                c.class  AS character_class,
                c.level,
                c.total_wins,
                c.gold,
                u.nickname AS user_nickname
            FROM characters c
            JOIN users u ON c.user_id = u.id
            ORDER BY c.total_wins DESC, c.level DESC, c.gold DESC
            LIMIT 20
        `);

        const seasonRes = await db.query(
            'SELECT id, name, started_at FROM leaderboard_seasons WHERE is_active = true LIMIT 1'
        );

        res.json({
            season: seasonRes.rows[0] || null,
            ranking: ranking.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar ranking.' });
    }
};

// GET /ranking/hall-of-fame — hall of fame permanente
exports.getHallOfFame = async (req, res) => {
    try {
        const hall = await db.query(`
            SELECT season_name, position, character_name, character_class,
                   level, total_wins, user_nickname, registered_at
            FROM hall_of_fame
            ORDER BY registered_at DESC, position ASC
            LIMIT 50
        `);

        res.json({ hall: hall.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar Hall of Fame.' });
    }
};

// GET /ranking/achievements — conquistas do personagem autenticado
exports.getMyAchievements = async (req, res) => {
    try {
        const userId = req.user.id;

        const charRes = await db.query('SELECT id FROM characters WHERE user_id = $1', [userId]);
        if (charRes.rows.length === 0) return res.status(404).json({ error: 'Personagem não encontrado.' });
        const charId = charRes.rows[0].id;

        // Busca todas as conquistas com flag se o personagem desbloqueou
        const result = await db.query(`
            SELECT
                a.key,
                a.name,
                a.description,
                a.badge_icon,
                a.badge_color,
                CASE WHEN ca.id IS NOT NULL THEN true ELSE false END AS unlocked,
                ca.unlocked_at
            FROM achievements a
            LEFT JOIN character_achievements ca
                ON ca.achievement_id = a.id AND ca.character_id = $1
            ORDER BY unlocked DESC, a.id ASC
        `, [charId]);

        res.json({ achievements: result.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar conquistas.' });
    }
};

/**
 * Encerra a temporada ativa, salva o snapshot, registra top-3 no Hall of Fame
 * e concede recompensas de ouro ao top-10. Chamado pelo cron job.
 */
exports.closeSeasonAndReset = async () => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Buscar temporada ativa
        const seasonRes = await client.query(
            'SELECT id, name FROM leaderboard_seasons WHERE is_active = true LIMIT 1'
        );
        if (seasonRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return;
        }
        const season = seasonRes.rows[0];

        // Buscar top-10 da temporada
        const top10 = await client.query(`
            SELECT
                ROW_NUMBER() OVER (ORDER BY c.total_wins DESC, c.level DESC, c.gold DESC) AS position,
                c.id, c.name, c.class, c.level, c.total_wins, c.gold,
                u.nickname
            FROM characters c
            JOIN users u ON c.user_id = u.id
            ORDER BY c.total_wins DESC, c.level DESC, c.gold DESC
            LIMIT 10
        `);

        // Salvar snapshot em season_rankings
        for (const row of top10.rows) {
            await client.query(
                `INSERT INTO season_rankings
                 (season_id, position, character_name, character_class, level, total_wins, gold, user_nickname, reward_granted)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)`,
                [season.id, row.position, row.name, row.class, row.level, row.total_wins, row.gold, row.nickname]
            );
        }

        // Registrar top-3 no Hall of Fame permanente
        for (const row of top10.rows.slice(0, 3)) {
            await client.query(
                `INSERT INTO hall_of_fame (season_name, position, character_name, character_class, level, total_wins, user_nickname)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [season.name, row.position, row.name, row.class, row.level, row.total_wins, row.nickname]
            );
        }

        // Recompensas de ouro para o top-10
        const goldRewards = [5000, 3000, 2000, 1000, 800, 600, 400, 300, 200, 100];
        for (let i = 0; i < top10.rows.length; i++) {
            const reward = goldRewards[i] || 100;
            await client.query(
                'UPDATE characters SET gold = gold + $1 WHERE id = $2',
                [reward, top10.rows[i].id]
            );
        }

        // Encerrar temporada atual
        await client.query(
            'UPDATE leaderboard_seasons SET is_active = false, ended_at = NOW() WHERE id = $1',
            [season.id]
        );

        // Criar nova temporada
        const now = new Date();
        const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        const newName = `Temporada de ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
        await client.query(
            'INSERT INTO leaderboard_seasons (name, started_at, is_active) VALUES ($1, NOW(), true)',
            [newName]
        );

        await client.query('COMMIT');
        console.log(`[CRON] Temporada "${season.name}" encerrada. Nova temporada "${newName}" iniciada.`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[CRON] Erro ao encerrar temporada:', err.message);
    } finally {
        client.release();
    }
};
