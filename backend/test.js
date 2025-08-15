// Simple test script for backend functionality
const { Pool } = require('pg');

// Test database connection
async function testDatabase() {
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'task_manager',
        password: 'password',
        port: 5432,
    });

    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful:', result.rows[0]);
        
        // Test table creation
        await pool.query(`
            CREATE TABLE IF NOT EXISTS test_users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Test table creation successful');
        
        // Clean up
        await pool.query('DROP TABLE IF EXISTS test_users');
        console.log('✅ Test cleanup successful');
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
    } finally {
        await pool.end();
    }
}

// Test the database
testDatabase();
