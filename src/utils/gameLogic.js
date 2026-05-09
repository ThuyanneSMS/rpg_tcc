// Tabela de níveis estendida até nível 10
const levelThresholds = [
    { level: 1,  xp: 0    },
    { level: 2,  xp: 100  },
    { level: 3,  xp: 280  },
    { level: 4,  xp: 560  },
    { level: 5,  xp: 1000 },
    { level: 6,  xp: 1600 },
    { level: 7,  xp: 2500 },
    { level: 8,  xp: 3700 },
    { level: 9,  xp: 5200 },
    { level: 10, xp: 7000 },
];

const checkLevelUp = (character) => {
    let newLevel = character.level;

    for (let i = levelThresholds.length - 1; i >= 0; i--) {
        if (character.experience >= levelThresholds[i].xp) {
            if (levelThresholds[i].level > character.level) {
                newLevel = levelThresholds[i].level;
            }
            break;
        }
    }

    if (newLevel > character.level) {
        const levelsGained = newLevel - character.level;
        return {
            leveledUp: true,
            newLevel,
            attackBonus:  levelsGained * 5,
            defenseBonus: levelsGained * 4,
            healthBonus:  levelsGained * 12,
            pointsBonus:  levelsGained * 3
        };
    }

    return { leveledUp: false };
};

/**
 * Fórmula de dano balanceada.
 * Usa redução percentual: defender_defense amortece sem anular o dano.
 * Variância de ±15% para imprevisibilidade.
 */
const calcDamage = (attack, defense) => {
    const base = attack * (100 / (100 + defense));
    const variance = 0.85 + Math.random() * 0.30; // 85% ~ 115%
    return Math.max(1, Math.floor(base * variance));
};

module.exports = { checkLevelUp, calcDamage };
