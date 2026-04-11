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