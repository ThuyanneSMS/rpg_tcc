const db = require('../config/db');

// Slots de equipamento válidos
const EQUIPMENT_SLOTS = ['helmet', 'chest', 'gloves', 'boots', 'weapon', 'shield', 'ring', 'necklace'];

// Listar todo o inventário e ouro do personagem
exports.getInventory = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const charRes = await db.query('SELECT id, gold FROM characters WHERE user_id = $1', [userId]);
        if (charRes.rows.length === 0) return res.status(404).json({ error: 'Personagem não encontrado.' });
        const character = charRes.rows[0];

        const invRes = await db.query('SELECT * FROM inventory WHERE character_id = $1 ORDER BY equipment_slot ASC, item_name ASC', [character.id]);
        
        // Separar itens de equipamentos
        const items = invRes.rows.filter(i => !i.equipment_slot);
        const equipment = invRes.rows.filter(i => !!i.equipment_slot);

        res.json({ gold: character.gold, items, equipment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar inventário do personagem.' });
    }
};

// Equipar ou Desequipar um item
exports.toggleEquip = async (req, res) => {
    try {
        const userId = req.user.id;
        const { inventoryId, equip } = req.body;

        const charRes = await db.query('SELECT id FROM characters WHERE user_id = $1', [userId]);
        if (charRes.rows.length === 0) return res.status(404).json({ error: 'Personagem não encontrado.' });
        const character = charRes.rows[0];

        const itemRes = await db.query('SELECT * FROM inventory WHERE id = $1 AND character_id = $2', [inventoryId, character.id]);
        if (itemRes.rows.length === 0) return res.status(404).json({ error: 'Item não encontrado no inventário.' });
        const item = itemRes.rows[0];

        // Só pode equipar itens que possuem slot
        if (!item.equipment_slot) {
            return res.status(400).json({ error: 'Este item não pode ser equipado.' });
        }

        if (equip) {
            // Desequipar item do mesmo slot primeiro (só 1 por slot)
            await db.query('UPDATE inventory SET is_equipped = false WHERE character_id = $1 AND equipment_slot = $2', [character.id, item.equipment_slot]);
            // Equipar o item solicitado
            await db.query('UPDATE inventory SET is_equipped = true WHERE id = $1', [item.id]);
            res.json({ message: `Você equipou ${item.item_name}.` });
        } else {
            await db.query('UPDATE inventory SET is_equipped = false WHERE id = $1', [item.id]);
            res.json({ message: `Você desequipou ${item.item_name}.` });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao modificar equipamento.' });
    }
};

// Usar item fora da Batalha (Cura HP)
exports.useItemOutBattle = async (req, res) => {
    try {
        const userId = req.user.id;
        const { inventoryId } = req.body;

        const charRes = await db.query('SELECT id, current_health, base_health FROM characters WHERE user_id = $1', [userId]);
        if (charRes.rows.length === 0) return res.status(404).json({ error: 'Personagem não encontrado.' });
        const character = charRes.rows[0];

        const itemRes = await db.query('SELECT * FROM inventory WHERE id = $1 AND character_id = $2 AND quantity > 0', [inventoryId, character.id]);
        if (itemRes.rows.length === 0) return res.status(404).json({ error: 'Item indisponível no inventário.' });
        const item = itemRes.rows[0];

        if (item.item_type !== 'potion') {
            return res.status(400).json({ error: 'Você só pode consumir poções.' });
        }

        if (character.current_health >= character.base_health) {
            return res.status(400).json({ error: 'Sua vida já está no limite máximo.' });
        }

        // Subtrai quantidade
        await db.query('UPDATE inventory SET quantity = quantity - 1 WHERE id = $1', [item.id]);
        
        // Remove item se a quantidade chegou a 0
        const updatedItem = await db.query('SELECT quantity FROM inventory WHERE id = $1', [item.id]);
        if (updatedItem.rows[0].quantity <= 0) {
            await db.query('DELETE FROM inventory WHERE id = $1', [item.id]);
        }

        // Recupera vida (até o máximo permitido pelo base_health)
        const healAmount = item.stat_bonus || 50; 
        let newHealth = character.current_health + healAmount;
        if (newHealth > character.base_health) newHealth = character.base_health;

        await db.query('UPDATE characters SET current_health = $1 WHERE id = $2', [newHealth, character.id]);

        res.json({ message: `Você bebeu uma ${item.item_name} e recuperou ${healAmount} HP.`, currentHealth: newHealth });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao usar o item.' });
    }
};