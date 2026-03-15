const express = require('express');
const Order = require('../models_old/Order');
const Product = require('../models_old/Product');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
    try {
        const { items, total_amount, shipping_address, payment_method } = req.body;
        const userId = req.user.id;

        for (const item of items) {
            const product = await Product.findById(item.product_id);
            if (!product || product.stock < item.quantity) {
                return res.status(400).json({ 
                    error: `Insufficient stock for product: ${product?.name || 'Unknown'}` 
                });
            }
        }

        const orderId = await Order.create(
            {
                user_id: userId,
                total_amount,
                shipping_address,
                payment_method
            },
            items
        );

        res.status(201).json({ 
            message: 'Order created successfully', 
            order_id: orderId 
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

router.get('/my-orders', verifyToken, async (req, res) => {
    try {
        const orders = await Order.findByUser(req.user.id);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.user_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

module.exports = router;