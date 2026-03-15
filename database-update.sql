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