const db = require('../config/database');

class Order {
    static async create(orderData, items) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            const { user_id, total_amount, shipping_address, payment_method } = orderData;
            
            const [orderResult] = await connection.execute(
                'INSERT INTO orders (user_id, total_amount, shipping_address, payment_method) VALUES (?, ?, ?, ?)',
                [user_id, total_amount, shipping_address, payment_method]
            );

            const orderId = orderResult.insertId;

            for (const item of items) {
                await connection.execute(
                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                    [orderId, item.product_id, item.quantity, item.price]
                );

                await connection.execute(
                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }

            await connection.commit();
            return orderId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async findByUser(userId) {
        const [orders] = await db.execute(
            `SELECT o.*, 
                    COUNT(oi.id) as item_count,
                    JSON_ARRAYAGG(
                        JSON_OBJECT('product_name', p.name, 'quantity', oi.quantity, 'price', oi.price)
                    ) as items
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.order_date DESC`,
            [userId]
        );
        return orders;
    }

    static async findAll() {
        const [orders] = await db.execute(
            `SELECT o.*, u.username, u.email,
                    COUNT(oi.id) as item_count
             FROM orders o
             JOIN users u ON o.user_id = u.id
             LEFT JOIN order_items oi ON o.id = oi.order_id
             GROUP BY o.id
             ORDER BY o.order_date DESC`
        );
        return orders;
    }

    static async findById(id) {
        const [orders] = await db.execute(
            `SELECT o.*, u.username, u.email, u.full_name,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'product_id', p.id,
                            'product_name', p.name,
                            'quantity', oi.quantity,
                            'price', oi.price,
                            'image_url', p.image_url
                        )
                    ) as items
             FROM orders o
             JOIN users u ON o.user_id = u.id
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE o.id = ?
             GROUP BY o.id`,
            [id]
        );
        return orders[0];
    }

    static async updateStatus(id, status) {
        const [result] = await db.execute(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async getStats() {
        const [totalOrders] = await db.execute('SELECT COUNT(*) as count FROM orders');
        const [totalRevenue] = await db.execute('SELECT SUM(total_amount) as total FROM orders WHERE status != "cancelled"');
        
        return {
            total_orders: totalOrders[0].count,
            total_revenue: totalRevenue[0].total || 0
        };
    }

    static async getRecent(limit = 5) {
        const [orders] = await db.execute(
            `SELECT o.*, u.username
             FROM orders o
             JOIN users u ON o.user_id = u.id
             ORDER BY o.order_date DESC
             LIMIT ?`,
            [limit]
        );
        return orders;
    }
}

module.exports = Order;