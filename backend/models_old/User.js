const db = require('../config/database');

class User {
    static async create(userData) {
        const { username, email, password, full_name } = userData;
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
            [username, email, password, full_name]
        );
        return result.insertId;
    }

    static async findByUsername(username) {
        const [users] = await db.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );
        return users[0];
    }

    static async findById(id) {
        const [users] = await db.execute(
            'SELECT id, username, email, full_name, is_admin, created_at FROM users WHERE id = ?',
            [id]
        );
        return users[0];
    }

    static async getAll() {
        const [users] = await db.execute(
            'SELECT id, username, email, full_name, is_admin, created_at FROM users ORDER BY created_at DESC'
        );
        return users;
    }

    static async update(id, userData) {
        const { full_name, address, phone } = userData;
        const [result] = await db.execute(
            'UPDATE users SET full_name = ?, address = ?, phone = ? WHERE id = ?',
            [full_name, address, phone, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = User;