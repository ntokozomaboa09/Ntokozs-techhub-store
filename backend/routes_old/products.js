const express = require('express');
const Product = require('../models_old/Product');
const Category = require('../models_old/Category');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { category, brand, min_price, max_price, search, featured } = req.query;
        
        const filters = {
            category,
            brand,
            min_price,
            max_price,
            search,
            featured: featured === 'true'
        };

        const products = await Product.findAll(filters);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

router.get('/featured', async (req, res) => {
    try {
        const products = await Product.getFeatured();
        res.json(products);
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({ error: 'Failed to fetch featured products' });
    }
});

router.get('/brands', async (req, res) => {
    try {
        const brands = await Product.getBrands();
        res.json(brands);
    } catch (error) {
        console.error('Error fetching brands:', error);
        res.status(500).json({ error: 'Failed to fetch brands' });
    }
});

router.get('/categories/all', async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        console.log('🔍 Fetching product with ID:', productId);
        
        const product = await Product.findById(productId);
        
        if (!product) {
            console.log('❌ Product not found with ID:', productId);
            return res.status(404).json({ error: 'Product not found' });
        }

        const db = require('../config/database');
        const [reviews] = await db.execute(
            'SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC',
            [productId]
        );

        product.reviews = reviews || [];
        product.average_rating = reviews.length > 0 
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        console.log('✅ Product found:', product.name);
        res.json(product);
    } catch (error) {
        console.error('❌ Error fetching product by ID:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

router.post('/:id/reviews', verifyToken, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const userId = req.user.id;

        await require('../config/database').execute(
            'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
            [userId, req.params.id, rating, comment]
        );

        res.status(201).json({ message: 'Review added successfully' });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: 'Failed to add review' });
    }
});

module.exports = router;