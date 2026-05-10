-- ==========================================
-- SCRIPT DE CONSULTAS ÚTEIS (CHATS & DB)
-- Use estas queries no pgAdmin para verificar 
-- o status do jogo, usuários, heróis e itens.
-- ==========================================

-- 1. Consultar todos os Usuários cadastrados (Sem exibir senhas por segurança visual)
SELECT id, full_name, nickname, email, age, gender, country, created_at 
FROM users 
ORDER BY id ASC;


-- 2. Consultar um Usuário específico pelo Apelido (Mude o 'NICKNAME_AQUI')
SELECT * 
FROM users 
WHERE nickname = 'NICKNAME_AQUI';


-- 3. Consultar todos os Personagens (Heróis) e quem é o dono (JOIN com a tabela de usuários)
SELECT 
    c.id AS character_id, 
    c.name AS character_name, 
    c.class, 
    c.level, 
    c.experience, 
    c.gold,
    u.nickname AS owner_nickname
FROM characters c
JOIN users u ON c.user_id = u.id
ORDER BY c.level DESC;


-- 4. Ver as Estatísticas de Combate completas de um Personagem Específico
SELECT name, current_health, base_health, base_attack, base_defense, base_speed 
FROM characters 
WHERE name = 'NOME_DO_PERSONAGEM';


-- 5. Consultar todo o Inventário associado a um determinado Jogador (JOIN com personagem e usuario)
SELECT 
    i.item_name, 
    i.item_type, 
    i.quantity, 
    i.is_equipped, 
    i.stat_bonus,
    c.name AS owner_character
FROM inventory i
JOIN characters c ON i.character_id = c.id
JOIN users u ON c.user_id = u.id
WHERE u.nickname = 'SEU_NICKNAME_AQUI'; -- Insira seu apelido real para testar


-- 6. Consultar quem está em Batalha no exato momento (Para debugar o sistema de fuga)
SELECT 
    a.monster_name, 
    a.monster_hp, 
    a.monster_max_hp, 
    c.name AS fighting_hero
FROM active_battles a
JOIN characters c ON a.character_id = c.id;


-- 7. [OPCIONAL / CHEAT] Dar 10.000 de Ouro para um Personagem Específico
-- IMPORTANTE: Mude o NOME antes de executar essa linha!
-- UPDATE characters SET gold = gold + 10000 WHERE name = 'NOME_DO_HEROI';

-- 8. [OPCIONAL / CHEAT] Subir Level Forçado de um Personagem Específico
-- UPDATE characters SET level = 50, experience = 99999 WHERE name = 'NOME_DO_HEROI';


-- ==========================================
-- CONSULTAS ADICIONAIS (Sistema de Equipamentos, Gênero e Inventário Expandido)
-- ==========================================

-- 9. Ver todos os Equipamentos equipados de um Personagem (Paper Doll)
SELECT 
    i.equipment_slot AS slot,
    i.item_name,
    i.stat_bonus AS bonus,
    CASE 
        WHEN i.equipment_slot IN ('weapon', 'gloves', 'ring') THEN 'Ataque'
        WHEN i.equipment_slot IN ('helmet', 'chest', 'shield', 'necklace') THEN 'Defesa'
        WHEN i.equipment_slot = 'boots' THEN 'Velocidade'
    END AS tipo_bonus
FROM inventory i
JOIN characters c ON i.character_id = c.id
WHERE c.name = 'NOME_DO_PERSONAGEM'
  AND i.is_equipped = true
  AND i.equipment_slot IS NOT NULL
ORDER BY i.equipment_slot;


-- 10. Ver Inventário completo separado por tipo (Consumíveis vs Equipamentos)
SELECT 
    c.name AS personagem,
    i.item_name,
    i.item_type,
    i.quantity,
    i.is_equipped,
    i.stat_bonus,
    COALESCE(i.equipment_slot, 'consumível') AS categoria
FROM inventory i
JOIN characters c ON i.character_id = c.id
WHERE c.name = 'NOME_DO_PERSONAGEM'
ORDER BY i.equipment_slot IS NULL, i.equipment_slot, i.item_name;


-- 11. Calcular os Bônus Totais de Equipamento de cada Personagem
SELECT 
    c.name AS personagem,
    c.class AS classe,
    c.base_attack AS ataque_base,
    c.base_defense AS defesa_base,
    c.base_speed AS velocidade_base,
    COALESCE(SUM(CASE WHEN i.equipment_slot IN ('weapon', 'gloves', 'ring') THEN i.stat_bonus ELSE 0 END), 0) AS bonus_ataque,
    COALESCE(SUM(CASE WHEN i.equipment_slot IN ('helmet', 'chest', 'shield', 'necklace') THEN i.stat_bonus ELSE 0 END), 0) AS bonus_defesa,
    COALESCE(SUM(CASE WHEN i.equipment_slot = 'boots' THEN i.stat_bonus ELSE 0 END), 0) AS bonus_velocidade,
    c.base_attack + COALESCE(SUM(CASE WHEN i.equipment_slot IN ('weapon', 'gloves', 'ring') THEN i.stat_bonus ELSE 0 END), 0) AS ataque_total,
    c.base_defense + COALESCE(SUM(CASE WHEN i.equipment_slot IN ('helmet', 'chest', 'shield', 'necklace') THEN i.stat_bonus ELSE 0 END), 0) AS defesa_total,
    c.base_speed + COALESCE(SUM(CASE WHEN i.equipment_slot = 'boots' THEN i.stat_bonus ELSE 0 END), 0) AS velocidade_total
FROM characters c
LEFT JOIN inventory i ON i.character_id = c.id AND i.is_equipped = true AND i.equipment_slot IS NOT NULL
GROUP BY c.id, c.name, c.class, c.base_attack, c.base_defense, c.base_speed
ORDER BY c.name;


-- 12. Ver Aparência (Gênero) de todos os Personagens
SELECT 
    c.name AS personagem,
    c.class AS classe,
    c.gender AS aparencia,
    c.level,
    u.nickname AS jogador
FROM characters c
JOIN users u ON c.user_id = u.id
ORDER BY c.name;


-- 13. Contar quantos Itens e Equipamentos cada Jogador possui
SELECT 
    u.nickname AS jogador,
    c.name AS personagem,
    COUNT(CASE WHEN i.equipment_slot IS NULL THEN 1 END) AS total_consumiveis,
    COUNT(CASE WHEN i.equipment_slot IS NOT NULL THEN 1 END) AS total_equipamentos,
    COUNT(CASE WHEN i.is_equipped = true THEN 1 END) AS itens_equipados,
    COUNT(*) AS total_itens
FROM users u
JOIN characters c ON c.user_id = u.id
LEFT JOIN inventory i ON i.character_id = c.id
GROUP BY u.nickname, c.name
ORDER BY total_itens DESC;


-- 14. Ver quais Slots de Equipamento estão vazios para um Personagem
SELECT slot_name AS slot_vazio
FROM (VALUES ('helmet'), ('chest'), ('gloves'), ('boots'), ('weapon'), ('shield'), ('ring'), ('necklace')) AS slots(slot_name)
WHERE slot_name NOT IN (
    SELECT equipment_slot 
    FROM inventory 
    WHERE character_id = (SELECT id FROM characters WHERE name = 'NOME_DO_PERSONAGEM')
      AND is_equipped = true
      AND equipment_slot IS NOT NULL
);


-- 15. Ranking de Personagens por Poder Total (ataque + defesa + velocidade com equipamentos)
SELECT 
    c.name AS personagem,
    c.class AS classe,
    c.level,
    c.base_attack + c.base_defense + c.base_speed AS poder_base,
    COALESCE(SUM(i.stat_bonus), 0) AS bonus_total_equip,
    c.base_attack + c.base_defense + c.base_speed + COALESCE(SUM(i.stat_bonus), 0) AS poder_total
FROM characters c
LEFT JOIN inventory i ON i.character_id = c.id AND i.is_equipped = true AND i.equipment_slot IS NOT NULL
GROUP BY c.id, c.name, c.class, c.level, c.base_attack, c.base_defense, c.base_speed
ORDER BY poder_total DESC;


-- 16. [OPCIONAL / CHEAT] Dar um Equipamento específico a um Personagem
-- INSERT INTO inventory (character_id, item_type, item_name, quantity, is_equipped, stat_bonus, equipment_slot)
-- VALUES ((SELECT id FROM characters WHERE name = 'NOME_DO_HEROI'), 'weapon', 'Espada de Aço', 1, false, 20, 'weapon');

-- 17. [OPCIONAL / CHEAT] Equipar todos os itens de um Personagem de uma vez
-- UPDATE inventory SET is_equipped = true WHERE character_id = (SELECT id FROM characters WHERE name = 'NOME_DO_HEROI') AND equipment_slot IS NOT NULL;

-- 18. [OPCIONAL / CHEAT] Trocar aparência de um Personagem
-- UPDATE characters SET gender = 'Feminino' WHERE name = 'NOME_DO_HEROI';


-- ==========================================
-- CONSULTAS DE CONQUISTAS (Achievements)
-- ==========================================

-- 19. Ver todas as Conquistas cadastradas na tabela achievements
SELECT id, key, name, description, badge_icon
FROM achievements
ORDER BY id;


-- 20. Ver todas as Conquistas desbloqueadas por todos os Personagens
SELECT
    c.name          AS personagem,
    u.nickname      AS jogador,
    a.key           AS conquista_key,
    a.name          AS conquista_nome,
    a.description   AS descricao,
    a.badge_icon    AS icone,
    ca.unlocked_at  AS desbloqueada_em
FROM character_achievements ca
JOIN characters c  ON ca.character_id  = c.id
JOIN users u       ON c.user_id        = u.id
JOIN achievements a ON ca.achievement_id = a.id
ORDER BY ca.unlocked_at DESC;


-- 21. Ver Conquistas de um Personagem Específico (Mude o nome)
SELECT
    a.key           AS conquista_key,
    a.name          AS conquista_nome,
    a.description   AS descricao,
    a.badge_icon    AS icone,
    ca.unlocked_at  AS desbloqueada_em
FROM character_achievements ca
JOIN achievements a  ON ca.achievement_id = a.id
JOIN characters c    ON ca.character_id   = c.id
WHERE c.name = 'NOME_DO_PERSONAGEM'
ORDER BY ca.unlocked_at DESC;


-- 22. Contar quantas Conquistas cada Personagem possui (Ranking de Conquistas)
SELECT
    c.name      AS personagem,
    u.nickname  AS jogador,
    c.level,
    COUNT(ca.achievement_id) AS total_conquistas
FROM characters c
JOIN users u ON c.user_id = u.id
LEFT JOIN character_achievements ca ON ca.character_id = c.id
GROUP BY c.id, c.name, u.nickname, c.level
ORDER BY total_conquistas DESC, c.level DESC;


-- 23. Ver quais Conquistas ainda NÃO foram desbloqueadas por um Personagem
SELECT
    a.key          AS conquista_key,
    a.name         AS conquista_nome,
    a.description  AS descricao
FROM achievements a
WHERE a.id NOT IN (
    SELECT achievement_id
    FROM character_achievements
    WHERE character_id = (SELECT id FROM characters WHERE name = 'NOME_DO_PERSONAGEM')
)
ORDER BY a.id;


-- 24. Verificar se uma Conquista Específica foi registrada para um Personagem
SELECT
    c.name      AS personagem,
    a.key       AS conquista_key,
    a.name      AS conquista_nome,
    CASE
        WHEN ca.id IS NOT NULL THEN 'SIM - Desbloqueada'
        ELSE 'NÃO - Bloqueada'
    END AS status,
    ca.unlocked_at AS desbloqueada_em
FROM characters c
CROSS JOIN achievements a
LEFT JOIN character_achievements ca
    ON ca.character_id  = c.id
    AND ca.achievement_id = a.id
WHERE c.name = 'NOME_DO_PERSONAGEM'
ORDER BY a.id;


-- 25. Ver a Conquista mais recente desbloqueada por cada Personagem
SELECT DISTINCT ON (c.id)
    c.name          AS personagem,
    u.nickname      AS jogador,
    a.name          AS ultima_conquista,
    ca.unlocked_at  AS desbloqueada_em
FROM character_achievements ca
JOIN characters c   ON ca.character_id   = c.id
JOIN users u        ON c.user_id         = u.id
JOIN achievements a ON ca.achievement_id = a.id
ORDER BY c.id, ca.unlocked_at DESC;


-- 26. Verificar se a tabela character_achievements possui registros (diagnóstico rápido)
SELECT
    COUNT(*) AS total_registros,
    MIN(unlocked_at) AS primeiro_registro,
    MAX(unlocked_at) AS ultimo_registro
FROM character_achievements;


-- 27. [OPCIONAL / CHEAT] Desbloquear manualmente uma Conquista para um Personagem
-- INSERT INTO character_achievements (character_id, achievement_id)
-- VALUES (
--     (SELECT id FROM characters WHERE name = 'NOME_DO_HEROI'),
--     (SELECT id FROM achievements WHERE key = 'CHAVE_DA_CONQUISTA')
-- ) ON CONFLICT DO NOTHING;

-- 28. [OPCIONAL / CHEAT] Remover uma Conquista de um Personagem (para reteste)
-- DELETE FROM character_achievements
-- WHERE character_id  = (SELECT id FROM characters WHERE name = 'NOME_DO_HEROI')
--   AND achievement_id = (SELECT id FROM achievements WHERE key = 'CHAVE_DA_CONQUISTA');