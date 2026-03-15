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