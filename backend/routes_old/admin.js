const express = require('express');
const Product = require('../models_old/Product');
const Order = require('../models_old/Order');
const User = require('../models_old/User');
const Category = require('../models_old/Category');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, verifyAdmin);

router.get('/stats', async (req, res) => {
    try {
        const products = await Product.findAll();
        const orderStats = await Order.getStats();
        const users = await User.getAll();

        res.json({
            total_products: products.length,
            total_orders: orderStats.total_orders,
            total_revenue: orderStats.total_revenue,
            total_users: users.length
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.findAll();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

router.put('/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Order.updateStatus(req.params.id, status);

        if (!updated) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

router.get('/users', async (req, res) => {
    try {
        const users = await User.getAll();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const deleted = await User.delete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

router.post('/products', async (req, res) => {
    try {
        const productId = await Product.create(req.body);
        res.status(201).json({ 
            message: 'Product added successfully', 
            product_id: productId 
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

router.put('/products/:id', async (req, res) => {
    try {
        const updated = await Product.update(req.params.id, req.body);

        if (!updated) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

router.delete('/products/:id', async (req, res) => {
    try {
        const deleted = await Product.delete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

router.post('/categories', async (req, res) => {
    try {
        const categoryId = await Category.create(req.body);
        res.status(201).json({ 
            message: 'Category added successfully', 
            category_id: categoryId 
        });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ error: 'Failed to add category' });
    }
});

router.put('/categories/:id', async (req, res) => {
    try {
        const updated = await Category.update(req.params.id, req.body);

        if (!updated) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        const productCount = await Category.getProductCount(req.params.id);
        
        if (productCount > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete category with existing products' 
            });
        }

        const deleted = await Category.delete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

module.exports = router;