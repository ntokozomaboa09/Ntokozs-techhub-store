const db = require('../config/database');

class Category {
    static async create(categoryData) {
        const { name, description, icon } = categoryData;
        const [result] = await db.execute(
            'INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)',
            [name, description, icon]
        );
        return result.insertId;
    }

    static async findAll() {
        const [categories] = await db.execute('SELECT * FROM categories ORDER BY name');
        return categories;
    }

    static async findById(id) {
        const [categories] = await db.execute('SELECT * FROM categories WHERE id = ?', [id]);
        return categories[0];
    }

    static async update(id, categoryData) {
        const { name, description, icon } = categoryData;
        const [result] = await db.execute(
            'UPDATE categories SET name = ?, description = ?, icon = ? WHERE id = ?',
            [name, description, icon, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.execute('DELETE FROM categories WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getProductCount(id) {
        const [count] = await db.execute(
            'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
            [id]
        );
        return count[0].count;
    }
}

module.exports = Category;