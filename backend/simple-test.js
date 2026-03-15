const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ntokozs_techhub_store',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

async function test() {
    try {
        console.log('🔍 Testing database connection...');
        
        const [result] = await pool.execute('SELECT 1+1 as test');
        console.log('✅ Basic query works:', result[0].test);
        
        const [tables] = await pool.execute('SHOW TABLES');
        console.log('📊 Tables in database:', tables.length);
        console.log('Tables:', tables.map(t => Object.values(t)[0]).join(', '));
        
        const [products] = await pool.execute('SELECT * FROM products');
        console.log(`📦 Products found: ${products.length}`);
        
        if (products.length > 0) {
            console.log('✅ First product ID:', products[0].id);
            console.log('✅ First product name:', products[0].name);
            console.log('✅ First product price:', products[0].price);
        } else {
            console.log('❌ No products in database!');
        }
        
    } catch (error) {
        console.error('❌ ERROR:', error);
    }
    
    process.exit();
}

test();
