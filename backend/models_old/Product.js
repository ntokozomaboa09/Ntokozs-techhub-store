const db = require('../config/database');

class Product {
    static async create(productData) {
        const { name, description, price, stock, category_id, brand, specs, image_url, featured } = productData;
        const [result] = await db.execute(
            'INSERT INTO products (name, description, price, stock, category_id, brand, specs, image_url, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, description, price, stock, category_id, brand, JSON.stringify(specs), image_url, featured || false]
        );
        return result.insertId;
    }

    static async findAll(filters = {}) {
        let sql = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
        const params = [];

        if (filters.category) {
            sql += ' AND p.category_id = ?';
            params.push(filters.category);
        }

        if (filters.brand) {
            sql += ' AND p.brand = ?';
            params.push(filters.brand);
        }

        if (filters.min_price) {
            sql += ' AND p.price >= ?';
            params.push(filters.min_price);
        }

        if (filters.max_price) {
            sql += ' AND p.price <= ?';
            params.push(filters.max_price);
        }

        if (filters.search) {
            sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        if (filters.featured) {
            sql += ' AND p.featured = TRUE';
        }

        sql += ' ORDER BY p.created_at DESC';

        const [products] = await db.execute(sql, params);
        return products;
    }

    static async findById(id) {
        const [products] = await db.execute(
            'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
            [id]
        );
        return products[0];
    }

    static async getFeatured() {
        const [products] = await db.execute(
            'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.featured = TRUE LIMIT 8'
        );
        return products;
    }

    static async update(id, productData) {
        const { name, description, price, stock, category_id, brand, specs, image_url, featured } = productData;
        const [result] = await db.execute(
            'UPDATE products SET name=?, description=?, price=?, stock=?, category_id=?, brand=?, specs=?, image_url=?, featured=? WHERE id=?',
            [name, description, price, stock, category_id, brand, JSON.stringify(specs), image_url, featured, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.execute('DELETE FROM products WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async updateStock(id, quantity) {
        const [result] = await db.execute(
            'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
            [quantity, id, quantity]
        );
        return result.affectedRows > 0;
    }

    static async getBrands() {
        const [brands] = await db.execute('SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL ORDER BY brand');
        return brands.map(b => b.brand);
    }
}

module.exports = Product;