/**
 * Pool de missões diárias disponíveis.
 * Tipos:
 *   kill       — derrotar N monstros quaisquer
 *   earn_gold  — acumular N de ouro vindo de batalhas
 *   kill_boss  — derrotar um monstro específico (campo boss_name)
 *
 * min_level / max_level: faixa de nível do personagem em que a missão
 * pode aparecer. Alinhado com os tiers de monstros do battleController.
 *   Tier 1 (lv 1-2): Rato de Caverna, Lobo, Goblin
 *   Tier 2 (lv 2-3): Esqueleto, Zumbi, Bandido
 *   Tier 3 (lv 3-4): Orc Guerreiro, Lobisomem, Espectro
 *   Tier 4 (lv 4-5): Troll, Vampiro, Golem de Barro
 *   Tier 5 (lv 5+):  Mini Dragão, Golem de Pedra, Necromante
 */
const QUEST_POOL = [
    // ─── KILL GENÉRICO (disponível em qualquer nível) ─────────────────────
    {
        key: 'kill_3',
        type: 'kill',
        min_level: 1,
        target: 3,
        reward_gold: 30,
        reward_xp: 50,
        title: 'Caçada Rápida',
        description: 'Derrote 3 monstros.',
        icon: '⚔️',
    },
    {
        key: 'kill_5',
        type: 'kill',
        min_level: 1,
        target: 5,
        reward_gold: 65,
        reward_xp: 100,
        title: 'Exterminador',
        description: 'Derrote 5 monstros.',
        icon: '🗡️',
    },
    {
        key: 'kill_10',
        type: 'kill',
        min_level: 2,
        target: 10,
        reward_gold: 150,
        reward_xp: 250,
        title: 'Mestre Caçador',
        description: 'Derrote 10 monstros.',
        icon: '💀',
    },

    // ─── EARN GOLD (escalonado por nível) ────────────────────────────────
    {
        key: 'earn_30',
        type: 'earn_gold',
        min_level: 1,
        max_level: 2,
        target: 30,
        reward_gold: 30,
        reward_xp: 50,
        title: 'Primeiro Saque',
        description: 'Ganhe 30 de ouro em batalhas.',
        icon: '💰',
    },
    {
        key: 'earn_50',
        type: 'earn_gold',
        min_level: 2,
        max_level: 4,
        target: 50,
        reward_gold: 50,
        reward_xp: 80,
        title: 'Oportunista',
        description: 'Ganhe 50 de ouro em batalhas.',
        icon: '💰',
    },
    {
        key: 'earn_150',
        type: 'earn_gold',
        min_level: 3,
        target: 150,
        reward_gold: 100,
        reward_xp: 180,
        title: 'Caçador de Recompensas',
        description: 'Ganhe 150 de ouro em batalhas.',
        icon: '🏆',
    },
    {
        key: 'earn_300',
        type: 'earn_gold',
        min_level: 5,
        target: 300,
        reward_gold: 200,
        reward_xp: 350,
        title: 'Ganancioso',
        description: 'Ganhe 300 de ouro em batalhas.',
        icon: '👑',
    },

    // ─── KILL BOSS — Tier 1 (lv 1-2) ────────────────────────────────────
    {
        key: 'kill_goblin',
        type: 'kill_boss',
        min_level: 1,
        max_level: 3,
        target: 3,
        boss_name: 'Goblin',
        reward_gold: 25,
        reward_xp: 55,
        title: 'Exterminador de Goblins',
        description: 'Derrote 3 Goblins.',
        icon: '👺',
    },
    {
        key: 'kill_lobo',
        type: 'kill_boss',
        min_level: 1,
        max_level: 3,
        target: 2,
        boss_name: 'Lobo',
        reward_gold: 20,
        reward_xp: 45,
        title: 'Caçador de Lobos',
        description: 'Derrote 2 Lobos.',
        icon: '🐺',
    },

    // ─── KILL BOSS — Tier 2 (lv 2-4) ────────────────────────────────────
    {
        key: 'kill_esqueleto',
        type: 'kill_boss',
        min_level: 2,
        max_level: 4,
        target: 3,
        boss_name: 'Esqueleto',
        reward_gold: 45,
        reward_xp: 90,
        title: 'Destruidor de Ossos',
        description: 'Derrote 3 Esqueletos.',
        icon: '💀',
    },
    {
        key: 'kill_bandido',
        type: 'kill_boss',
        min_level: 2,
        max_level: 4,
        target: 2,
        boss_name: 'Bandido',
        reward_gold: 55,
        reward_xp: 100,
        title: 'Justiceiro',
        description: 'Derrote 2 Bandidos.',
        icon: '🗡️',
    },

    // ─── KILL BOSS — Tier 3 (lv 3-5) ────────────────────────────────────
    {
        key: 'kill_orc',
        type: 'kill_boss',
        min_level: 3,
        max_level: 6,
        target: 2,
        boss_name: 'Orc Guerreiro',
        reward_gold: 70,
        reward_xp: 140,
        title: 'Matador de Orcs',
        description: 'Derrote 2 Orcs Guerreiros.',
        icon: '🪓',
    },
    {
        key: 'kill_lobisomem',
        type: 'kill_boss',
        min_level: 3,
        max_level: 6,
        target: 1,
        boss_name: 'Lobisomem',
        reward_gold: 80,
        reward_xp: 150,
        title: 'Prata e Aço',
        description: 'Derrote um Lobisomem.',
        icon: '🌕',
    },

    // ─── KILL BOSS — Tier 4 (lv 4+) ─────────────────────────────────────
    {
        key: 'kill_troll',
        type: 'kill_boss',
        min_level: 4,
        target: 2,
        boss_name: 'Troll',
        reward_gold: 120,
        reward_xp: 220,
        title: 'Caçador de Trolls',
        description: 'Derrote 2 Trolls.',
        icon: '🪨',
    },
    {
        key: 'kill_vampire',
        type: 'kill_boss',
        min_level: 4,
        target: 1,
        boss_name: 'Vampiro',
        reward_gold: 150,
        reward_xp: 280,
        title: 'Caçador da Noite',
        description: 'Derrote um Vampiro.',
        icon: '🧛',
    },

    // ─── KILL BOSS — Tier 5 (lv 5+) ─────────────────────────────────────
    {
        key: 'kill_dragon',
        type: 'kill_boss',
        min_level: 5,
        target: 1,
        boss_name: 'Mini Dragão',
        reward_gold: 200,
        reward_xp: 400,
        title: 'Caçador de Dragões',
        description: 'Derrote um Mini Dragão.',
        icon: '🐉',
    },
    {
        key: 'kill_necro',
        type: 'kill_boss',
        min_level: 5,
        target: 1,
        boss_name: 'Necromante',
        reward_gold: 180,
        reward_xp: 360,
        title: 'Purificador',
        description: 'Derrote o Necromante.',
        icon: '☠️',
    },
];

/**
 * Retorna 3 missões aleatórias e únicas para o dia, filtradas pelo nível
 * do personagem. A seleção é determinística por (characterId + date) para
 * não re-sortear caso o endpoint seja chamado mais de uma vez no mesmo dia.
 * @param {number} characterId
 * @param {number} characterLevel — nível atual do personagem
 * @returns {Array} três objetos de missão
 */
function pickDailyQuests(characterId, characterLevel = 1) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Filtrar apenas missões acessíveis para o nível atual
    const eligible = QUEST_POOL.filter(q => {
        const okMin = q.min_level === undefined || characterLevel >= q.min_level;
        const okMax = q.max_level === undefined || characterLevel <= q.max_level;
        return okMin && okMax;
    });

    // Garante pelo menos 3 missões mesmo que o filtro retorne pouco
    const pool = eligible.length >= 3 ? eligible : QUEST_POOL.slice(0, 3);

    // Seed determinístico: mesmo personagem + mesmo dia = mesmas missões
    const seed = characterId * 31 + [...today].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const shuffled = [...pool].sort((a, b) => {
        const ha = Math.sin(seed + a.key.length) * 10000;
        const hb = Math.sin(seed + b.key.length) * 10000;
        return (ha - Math.floor(ha)) - (hb - Math.floor(hb));
    });
    return shuffled.slice(0, 3);
}

/**
 * Busca a definição de uma missão pelo key.
 * @param {string} key
 * @returns {object|undefined}
 */
function getQuestByKey(key) {
    return QUEST_POOL.find(q => q.key === key);
}

module.exports = { QUEST_POOL, pickDailyQuests, getQuestByKey };
