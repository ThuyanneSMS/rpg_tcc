const db = require('../config/db');

// Itens fixos da loja organizados por categoria
const shopItems = [
    // === ITENS CONSUMÍVEIS ===
    { id: 'potion_hp_small', name: 'Poção de Vida Menor', type: 'potion', category: 'item', price: 0, bonus: 30, description: 'Recupera 30 HP.' },
    { id: 'potion_hp', name: 'Poção de Vida', type: 'potion', category: 'item', price: 10, bonus: 50, description: 'Recupera 50 HP.' },
    { id: 'potion_hp_big', name: 'Poção de Vida Grande', type: 'potion', category: 'item', price: 30, bonus: 100, description: 'Recupera 100 HP.' },

    // === CAPACETES ===
    { id: 'helmet_leather', name: 'Capuz de Couro', type: 'helmet', category: 'equipment', slot: 'helmet', price: 0, bonus: 3, description: 'Um capuz simples. +3 Defesa.' },
    { id: 'helmet_iron', name: 'Elmo de Ferro', type: 'helmet', category: 'equipment', slot: 'helmet', price: 25, bonus: 6, description: 'Elmo resistente. +6 Defesa.' },
    { id: 'helmet_steel', name: 'Elmo de Aço', type: 'helmet', category: 'equipment', slot: 'helmet', price: 60, bonus: 12, description: 'Elmo reforçado. +12 Defesa.' },

    // === ARMADURAS (PEITORAL) ===
    { id: 'chest_cloth', name: 'Túnica de Aprendiz', type: 'chest', category: 'equipment', slot: 'chest', price: 0, bonus: 5, description: 'Roupa básica. +5 Defesa.' },
    { id: 'chest_leather', name: 'Peitoral de Couro', type: 'chest', category: 'equipment', slot: 'chest', price: 40, bonus: 10, description: 'Armadura leve. +10 Defesa.' },
    { id: 'chest_iron', name: 'Armadura de Ferro', type: 'chest', category: 'equipment', slot: 'chest', price: 80, bonus: 18, description: 'Armadura pesada. +18 Defesa.' },

    // === LUVAS ===
    { id: 'gloves_cloth', name: 'Luvas de Pano', type: 'gloves', category: 'equipment', slot: 'gloves', price: 0, bonus: 2, description: 'Luvas simples. +2 Ataque.' },
    { id: 'gloves_leather', name: 'Luvas de Couro', type: 'gloves', category: 'equipment', slot: 'gloves', price: 20, bonus: 5, description: 'Firmeza extra. +5 Ataque.' },
    { id: 'gloves_iron', name: 'Manoplas de Ferro', type: 'gloves', category: 'equipment', slot: 'gloves', price: 50, bonus: 10, description: 'Punhos de ferro. +10 Ataque.' },

    // === BOTAS ===
    { id: 'boots_cloth', name: 'Sandálias Simples', type: 'boots', category: 'equipment', slot: 'boots', price: 0, bonus: 2, description: 'Calçado básico. +2 Velocidade.' },
    { id: 'boots_leather', name: 'Botas de Couro', type: 'boots', category: 'equipment', slot: 'boots', price: 20, bonus: 5, description: 'Passos firmes. +5 Velocidade.' },
    { id: 'boots_iron', name: 'Grevas de Ferro', type: 'boots', category: 'equipment', slot: 'boots', price: 50, bonus: 10, description: 'Proteção nos pés. +10 Velocidade.' },

    // === ARMAS ===
    { id: 'weapon_stick', name: 'Graveto Afiado', type: 'weapon', category: 'equipment', slot: 'weapon', price: 0, bonus: 3, description: 'Melhor que nada. +3 Ataque.' },
    { id: 'weapon_sword', name: 'Espada de Ferro', type: 'weapon', category: 'equipment', slot: 'weapon', price: 50, bonus: 10, description: 'Lâmina confiável. +10 Ataque.' },
    { id: 'weapon_greatsword', name: 'Espada de Aço', type: 'weapon', category: 'equipment', slot: 'weapon', price: 100, bonus: 20, description: 'Lâmina devastadora. +20 Ataque.' },

    // === ESCUDOS ===
    { id: 'shield_wood', name: 'Escudo de Madeira', type: 'shield', category: 'equipment', slot: 'shield', price: 0, bonus: 4, description: 'Proteção básica. +4 Defesa.' },
    { id: 'shield_iron', name: 'Escudo de Ferro', type: 'shield', category: 'equipment', slot: 'shield', price: 40, bonus: 10, description: 'Muralha sólida. +10 Defesa.' },
    { id: 'shield_steel', name: 'Escudo de Aço', type: 'shield', category: 'equipment', slot: 'shield', price: 90, bonus: 18, description: 'Fortaleza móvel. +18 Defesa.' },

    // === ANÉIS ===
    { id: 'ring_copper', name: 'Anel de Cobre', type: 'ring', category: 'equipment', slot: 'ring', price: 15, bonus: 3, description: 'Brilho fraco. +3 Ataque.' },
    { id: 'ring_silver', name: 'Anel de Prata', type: 'ring', category: 'equipment', slot: 'ring', price: 45, bonus: 7, description: 'Poder misterioso. +7 Ataque.' },

    // === COLARES ===
    { id: 'necklace_bone', name: 'Colar de Ossos', type: 'necklace', category: 'equipment', slot: 'necklace', price: 15, bonus: 3, description: 'Amuleto sombrio. +3 Defesa.' },
    { id: 'necklace_gem', name: 'Colar de Gemas', type: 'necklace', category: 'equipment', slot: 'necklace', price: 50, bonus: 8, description: 'Poder arcano. +8 Defesa.' },
];

// Listar itens disponíveis na loja
exports.getShopItems = (req, res) => {
    res.json({ items: shopItems });
};

// Comprar item
exports.buyItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.body;

        const itemToBuy = shopItems.find(i => i.id === itemId);
        if (!itemToBuy) {
            return res.status(404).json({ error: 'Item não encontrado na loja.' });
        }

        // Buscar personagem para validar ouro
        const charRes = await db.query('SELECT id, gold FROM characters WHERE user_id = $1', [userId]);
        if (charRes.rows.length === 0) return res.status(404).json({ error: 'Personagem não encontrado.' });
        const character = charRes.rows[0];

        // Validar ouro (itens gratuitos passam direto)
        if (itemToBuy.price > 0 && character.gold < itemToBuy.price) {
            return res.status(400).json({ error: 'Ouro insuficiente para comprar este item.' });
        }

        // Descontar o ouro
        if (itemToBuy.price > 0) {
            await db.query('UPDATE characters SET gold = gold - $1 WHERE id = $2', [itemToBuy.price, character.id]);
        }

        // Verificar se já possui o item para apenas aumentar a quantidade
        const invRes = await db.query(
            'SELECT id, quantity FROM inventory WHERE character_id = $1 AND item_name = $2', 
            [character.id, itemToBuy.name]
        );
        
        if (invRes.rows.length > 0) {
            // Para equipamentos, não acumular — já possui
            if (itemToBuy.category === 'equipment') {
                // Devolver ouro se cobrou
                if (itemToBuy.price > 0) {
                    await db.query('UPDATE characters SET gold = gold + $1 WHERE id = $2', [itemToBuy.price, character.id]);
                }
                return res.status(400).json({ error: `Você já possui ${itemToBuy.name}.` });
            }
            await db.query('UPDATE inventory SET quantity = quantity + 1 WHERE id = $1', [invRes.rows[0].id]);
        } else {
            await db.query(
                'INSERT INTO inventory (character_id, item_type, item_name, quantity, is_equipped, stat_bonus, equipment_slot) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [character.id, itemToBuy.type, itemToBuy.name, 1, false, itemToBuy.bonus, itemToBuy.slot || null]
            );
        }

        res.json({ message: `Você comprou um(a) ${itemToBuy.name} com sucesso!`, item: itemToBuy });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no servidor ao realizar compra na loja.' });
    }
};