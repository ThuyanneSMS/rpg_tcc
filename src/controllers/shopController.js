const db = require('../config/db');

// Itens fixos da loja
const shopItems = [
    { id: 'potion_1', name: 'Poção de Vida', type: 'potion', price: 10, bonus: 50 }, // Bônus = cura
    { id: 'sword_1', name: 'Espada', type: 'sword', price: 50, bonus: 10 },        // Bônus = +10 Ataque
    { id: 'shield_1', name: 'Escudo', type: 'shield', price: 40, bonus: 10 }       // Bônus = +10 Defesa
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

        // Validar ouro
        if (character.gold < itemToBuy.price) {
            return res.status(400).json({ error: 'Ouro insuficiente para comprar este item.' });
        }

        // Descontar o ouro
        await db.query('UPDATE characters SET gold = gold - $1 WHERE id = $2', [itemToBuy.price, character.id]);

        // Verificar se já possui o item para apenas aumentar a quantidade
        const invRes = await db.query(
            'SELECT id, quantity FROM inventory WHERE character_id = $1 AND item_name = $2', 
            [character.id, itemToBuy.name]
        );
        
        if (invRes.rows.length > 0) {
            await db.query('UPDATE inventory SET quantity = quantity + 1 WHERE id = $1', [invRes.rows[0].id]);
        } else {
            await db.query(
                'INSERT INTO inventory (character_id, item_type, item_name, quantity, is_equipped, stat_bonus) VALUES ($1, $2, $3, $4, $5, $6)',
                [character.id, itemToBuy.type, itemToBuy.name, 1, false, itemToBuy.bonus]
            );
        }

        res.json({ message: `Você comprou um(a) ${itemToBuy.name} com sucesso!`, item: itemToBuy });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no servidor ao realizar compra na loja.' });
    }
};