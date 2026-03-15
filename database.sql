-- Criação da tabela de usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50) NOT NULL UNIQUE,
    age INT,
    gender VARCHAR(20),
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    country VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de personagens
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    class VARCHAR(20) NOT NULL, -- Guerreiro, Arqueiro, Mago
    level INT DEFAULT 1,
    experience INT DEFAULT 0,
    gold INT DEFAULT 0,
    unassigned_points INT DEFAULT 0,
    base_attack INT,
    base_defense INT,
    base_health INT,
    base_speed INT,
    current_health INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de inventário
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    character_id INT REFERENCES characters(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- potion, sword, shield
    item_name VARCHAR(50) NOT NULL,
    quantity INT DEFAULT 1,
    is_equipped BOOLEAN DEFAULT false,
    stat_bonus INT DEFAULT 0
);
