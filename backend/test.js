const db = require('./config/database');

async function testConnection() {
    console.log('Testing database connection...');
    
    try {
        const [result] = await db.execute('SELECT 1+1 as test');
        console.log('✅ Database connection successful!');
        console.log('Test query result:', result[0].test);
        
        const [products] = await db.execute('SELECT COUNT(*) as total FROM products');
        console.log(`✅ Products in database: ${products[0].total}`);
        
        if (products[0].total > 0) {
            const [firstProduct] = await db.execute('SELECT name, price FROM products LIMIT 1');
            console.log('✅ First product:', firstProduct[0].name, '- R' + firstProduct[0].price);
        } else {
            console.log('⚠️ No products found in database!');
        }
        
    } catch (error) {
        console.error('❌ Database connection failed!');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
    }
    
    process.exit();
}

testConnection();