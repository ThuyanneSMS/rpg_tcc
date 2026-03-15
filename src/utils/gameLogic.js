// niveis (levels)
const levelThresholds = [
    { level: 1, xp: 0 },
    { level: 2, xp: 100 },
    { level: 3, xp: 250 },
    { level: 4, xp: 500 },
    { level: 5, xp: 1000 },
];

const checkLevelUp = (character) => {
    let newLevel = character.level;
    
    // Procura na tabela de níveis para ver qual deveria ser o nível atual com base na experiência
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
            newLevel: newLevel,
            attackBonus: levelsGained * 5,
            defenseBonus: levelsGained * 5,
            healthBonus: levelsGained * 10,
            pointsBonus: levelsGained * 3
        };
    }
    
    return { leveledUp: false };
};

module.exports = { checkLevelUp };
