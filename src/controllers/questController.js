const db = require('../config/db');
const { pickDailyQuests, getQuestByKey } = require('../utils/quests');

/**
 * GET /api/quests
 * Retorna as 3 missões diárias do personagem.
 * Se ainda não foram criadas para hoje, insere no banco antes de retornar.
 */
exports.getDailyQuests = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().slice(0, 10);

        const charRes = await db.query('SELECT id, level FROM characters WHERE user_id = $1', [userId]);
        if (charRes.rows.length === 0)
            return res.status(404).json({ error: 'Personagem não encontrado.' });
        const characterId = charRes.rows[0].id;
        const characterLevel = charRes.rows[0].level;

        // Verificar se já existem missões para hoje
        const existing = await db.query(
            'SELECT * FROM character_daily_quests WHERE character_id = $1 AND quest_date = $2',
            [characterId, today]
        );

        if (existing.rows.length === 0) {
            // Gerar as 3 missões do dia filtradas pelo nível atual
            const dailyQuests = pickDailyQuests(characterId, characterLevel);
            for (const quest of dailyQuests) {
                await db.query(
                    `INSERT INTO character_daily_quests (character_id, quest_key, quest_date)
                     VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                    [characterId, quest.key, today]
                );
            }
        }

        // Buscar missões do banco e enriquecer com metadados do pool
        const rows = await db.query(
            'SELECT * FROM character_daily_quests WHERE character_id = $1 AND quest_date = $2 ORDER BY id ASC',
            [characterId, today]
        );

        const quests = rows.rows.map(row => {
            const meta = getQuestByKey(row.quest_key);
            return {
                id: row.id,
                key: row.quest_key,
                title: meta?.title ?? row.quest_key,
                description: meta?.description ?? '',
                icon: meta?.icon ?? '📜',
                type: meta?.type,
                target: meta?.target ?? 1,
                progress: row.progress,
                completed: row.completed,
                claimed: row.claimed,
                reward_gold: meta?.reward_gold ?? 0,
                reward_xp: meta?.reward_xp ?? 0,
            };
        });

        res.json({ quests, date: today });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar missões do dia.' });
    }
};

/**
 * POST /api/quests/claim
 * Body: { questId }
 * Resgata a recompensa de uma missão concluída (completed = true, claimed = false).
 */
exports.claimQuest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { questId } = req.body;

        if (!questId) return res.status(400).json({ error: 'questId é obrigatório.' });

        const charRes = await db.query('SELECT id FROM characters WHERE user_id = $1', [userId]);
        if (charRes.rows.length === 0)
            return res.status(404).json({ error: 'Personagem não encontrado.' });
        const characterId = charRes.rows[0].id;

        const questRes = await db.query(
            'SELECT * FROM character_daily_quests WHERE id = $1 AND character_id = $2',
            [questId, characterId]
        );
        if (questRes.rows.length === 0)
            return res.status(404).json({ error: 'Missão não encontrada.' });

        const quest = questRes.rows[0];

        if (!quest.completed)
            return res.status(400).json({ error: 'Missão ainda não foi concluída.' });
        if (quest.claimed)
            return res.status(400).json({ error: 'Recompensa já foi resgatada.' });

        const meta = getQuestByKey(quest.quest_key);
        if (!meta) return res.status(400).json({ error: 'Missão inválida.' });

        // Marcar como resgatada
        await db.query(
            'UPDATE character_daily_quests SET claimed = true WHERE id = $1',
            [questId]
        );

        // Entregar recompensa ao personagem
        await db.query(
            'UPDATE characters SET gold = gold + $1, experience = experience + $2 WHERE id = $3',
            [meta.reward_gold, meta.reward_xp, characterId]
        );

        res.json({
            message: `Recompensa da missão "${meta.title}" resgatada com sucesso!`,
            reward: { gold: meta.reward_gold, xp: meta.reward_xp },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao resgatar recompensa.' });
    }
};
