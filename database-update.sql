-- Atualização do Banco de Dados para incluir a tabela de Batalhas Ativas
CREATE TABLE IF NOT EXISTS active_battles (
    character_id INT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
    monster_name VARCHAR(50),
    monster_hp INT,
    monster_max_hp INT,
    monster_attack INT,
    monster_defense INT,
    monster_gold INT,
    monster_xp INT,
    is_defending BOOLEAN DEFAULT false
);

-- Adicionar coluna de slot de equipamento ao inventário
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS equipment_slot VARCHAR(20) DEFAULT NULL;
-- Slots possíveis: helmet, chest, gloves, boots, weapon, shield, ring, necklace
-- NULL = item consumível (poção, etc.)

-- Adicionar coluna de gênero/aparência ao personagem
ALTER TABLE characters ADD COLUMN IF NOT EXISTS gender VARCHAR(10) DEFAULT 'Masculino';
-- Valores: 'Masculino' ou 'Feminino'

-- ==========================================
-- SISTEMA DE CONQUISTAS (ACHIEVEMENTS)
-- ==========================================

-- Contador de vitórias por personagem
ALTER TABLE characters ADD COLUMN IF NOT EXISTS total_wins INT DEFAULT 0;

-- Catálogo global de conquistas
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,         -- identificador interno (ex: 'first_win')
    name VARCHAR(100) NOT NULL,              -- nome exibido
    description TEXT NOT NULL,              -- descrição
    badge_icon VARCHAR(10) NOT NULL,         -- emoji do badge
    badge_color VARCHAR(20) DEFAULT '#f1c40f' -- cor CSS do badge
);

-- Conquistas desbloqueadas por personagem
CREATE TABLE IF NOT EXISTS character_achievements (
    id SERIAL PRIMARY KEY,
    character_id INT REFERENCES characters(id) ON DELETE CASCADE,
    achievement_id INT REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(character_id, achievement_id)
);

-- Inserir catálogo de conquistas (sem duplicar)
INSERT INTO achievements (key, name, description, badge_icon, badge_color) VALUES
    ('first_win',      'Primeira Vitória',      'Venceu seu primeiro combate.',                     '⚔️',  '#f1c40f'),
    ('warrior_10',     'Caçador',               'Venceu 10 batalhas.',                              '🏹',  '#e67e22'),
    ('warrior_50',     'Matador Implacável',     'Venceu 50 batalhas.',                              '💀',  '#e74c3c'),
    ('warrior_100',    'Lenda das Batalhas',     'Venceu 100 batalhas.',                             '🔥',  '#c0392b'),
    ('level_5',        'Aventureiro',            'Alcançou o nível 5.',                              '⭐',  '#2ecc71'),
    ('level_10',       'Veterano',               'Alcançou o nível 10 (nível máximo).',              '🌟',  '#27ae60'),
    ('gold_1000',      'Comerciante',            'Acumulou 1.000 de ouro.',                          '💰',  '#f39c12'),
    ('gold_10000',     'Milionário',             'Acumulou 10.000 de ouro.',                         '👑',  '#d4ac0d'),
    ('survivor',       'Sobrevivente',           'Escapou de 10 batalhas usando a fuga.',            '🏃',  '#3498db'),
    ('dragon_slayer',  'Caçador de Dragões',     'Derrotou um Mini Dragão.',                         '🐉',  '#9b59b6')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- SISTEMA DE RANKING COM TEMPORADAS
-- ==========================================

-- Temporadas (criada automaticamente pelo servidor no início de cada mês)
CREATE TABLE IF NOT EXISTS leaderboard_seasons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,              -- ex: 'Temporada de Maio 2026'
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Snapshots do ranking ao fim de cada temporada
CREATE TABLE IF NOT EXISTS season_rankings (
    id SERIAL PRIMARY KEY,
    season_id INT REFERENCES leaderboard_seasons(id) ON DELETE CASCADE,
    position INT NOT NULL,
    character_name VARCHAR(100) NOT NULL,
    character_class VARCHAR(30) NOT NULL,
    level INT NOT NULL,
    total_wins INT NOT NULL,
    gold INT NOT NULL,
    user_nickname VARCHAR(100) NOT NULL,
    reward_granted BOOLEAN DEFAULT false
);

-- Hall of Fame: top-3 de cada temporada (permanente)
CREATE TABLE IF NOT EXISTS hall_of_fame (
    id SERIAL PRIMARY KEY,
    season_name VARCHAR(100) NOT NULL,
    position INT NOT NULL,
    character_name VARCHAR(100) NOT NULL,
    character_class VARCHAR(30) NOT NULL,
    level INT NOT NULL,
    total_wins INT NOT NULL,
    user_nickname VARCHAR(100) NOT NULL,
    registered_at TIMESTAMP DEFAULT NOW()
);

-- Criar temporada inicial se não existir nenhuma ativa
INSERT INTO leaderboard_seasons (name, started_at, is_active)
SELECT 'Temporada de Maio 2026', NOW(), true
WHERE NOT EXISTS (SELECT 1 FROM leaderboard_seasons WHERE is_active = true);

-- ============================================================

-- Funcionalidade 3: Sistema de Temas Visuais
-- Adiciona coluna 'theme' na tabela users
-- Temas válidos: default, dark, light, forest, cave, snow, volcano, shadow
-- ============================================================
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS theme VARCHAR(20) NOT NULL DEFAULT 'default';

-- Altera o DEFAULT da coluna para o novo tema padrão neutro
ALTER TABLE users ALTER COLUMN theme SET DEFAULT 'default';

-- Garante que valores fora do conjunto válido sejam rejeitados
DO $$
BEGIN
    -- Remove constraint antiga (sem 'default') se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_theme_check'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_theme_check;
    END IF;

    ALTER TABLE users
        ADD CONSTRAINT users_theme_check
        CHECK (theme IN ('default','dark','light','forest','cave','snow','volcano','shadow'));
END$$;