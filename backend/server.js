const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ntokozs_techhub_store',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

app.get('/api/test', async (req, res) => {
    res.json({ message: 'Server is working!' });
});

app.get('/api/test-db', async (req, res) => {
    try {
        const [result] = await db.execute('SELECT 1+1 as test');
        res.json({ success: true, test: result[0].test });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;
        
        const [existing] = await db.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
            [username, email, password, full_name]
        );
        
        res.status(201).json({ 
            message: 'Registration successful',
            token: 'token-' + result.insertId,
            user: {
                id: result.insertId,
                username,
                email,
                full_name,
                is_admin: false
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const [users] = await db.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        res.json({
            token: 'token-' + user.id,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                is_admin: user.is_admin || false
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const [products] = await db.execute(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            ORDER BY p.created_at DESC
        `);
        res.json(products);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        
        const [products] = await db.execute(
            'SELECT * FROM products WHERE id = ?',
            [productId]
        );
        
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const product = products[0];
        
        if (product.specs && typeof product.specs === 'string') {
            try {
                product.specs = JSON.parse(product.specs);
            } catch (e) {
                product.specs = {};
            }
        }
        
        const [category] = await db.execute(
            'SELECT name as category_name FROM categories WHERE id = ?',
            [product.category_id]
        );
        product.category_name = category.length > 0 ? category[0].category_name : null;
        
        const [reviews] = await db.execute(
            'SELECT * FROM reviews WHERE product_id = ?',
            [productId]
        );
        product.reviews = reviews;
        
        res.json(product);
    } catch (error) {
        console.error('Error in /api/products/:id:', error);
        res.status(500).json({ error: 'Failed to fetch product: ' + error.message });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const [categories] = await db.execute('SELECT * FROM categories ORDER BY name');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

app.get('/api/featured-products', async (req, res) => {
    try {
        const [products] = await db.execute(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.featured = TRUE LIMIT 8
        `);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch featured products' });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { items, total_amount, shipping_address, payment_method } = req.body;
        const token = req.headers.authorization?.split(' ')[1];
        
        console.log('Checkout request received');
        console.log('Token:', token);
        console.log('Items:', items);
        console.log('Total:', total_amount);
        
        if (!token) {
            return res.status(403).json({ error: 'No token provided' });
        }
        
        const userId = token.split('-')[1];
        console.log('User ID:', userId);
        
        if (!userId) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const [orderResult] = await connection.execute(
                'INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status) VALUES (?, ?, ?, ?, ?)',
                [userId, total_amount, shipping_address, payment_method, 'pending']
            );
            
            const orderId = orderResult.insertId;
            console.log('Order created with ID:', orderId);
            
            for (const item of items) {
                console.log('Adding item to order:', item);
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
            connection.release();
            
            res.status(201).json({ 
                message: 'Order created successfully', 
                order_id: orderId 
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order: ' + error.message });
    }
});

app.get('/api/my-orders', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(403).json({ error: 'No token provided' });
        }
        
        const userId = token.split('-')[1];
        
        const [orders] = await db.execute(
            `SELECT o.*, 
                    COUNT(oi.id) as item_count
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.order_date DESC`,
            [userId]
        );
        
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Ntokozs Techhub Store server running on port ${PORT}`);
    console.log(`📍 Test: http://localhost:${PORT}/api/test`);
    console.log(`📍 Test DB: http://localhost:${PORT}/api/test-db`);
    console.log(`📍 Products: http://localhost:${PORT}/api/products`);
    console.log(`📍 Product 1: http://localhost:${PORT}/api/products/1`);
});