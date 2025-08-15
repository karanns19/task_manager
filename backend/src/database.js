const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'task_manager',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    // Connection pool settings
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
});

// Enhanced error handling for the pool
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    // Don't exit the process, just log the error
    // The pool will automatically remove the failed client
});

pool.on('connect', (client) => {
    console.log('New client connected to PostgreSQL database');
});

pool.on('acquire', (client) => {
    console.log('Client acquired from pool');
});

pool.on('release', (client) => {
    console.log('Client released back to pool');
});

// Test database connection with retry logic
async function testConnection(retries = 5, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await pool.query('SELECT NOW()');
            console.log('✅ Connected to PostgreSQL database:', result.rows[0].now);
            return true;
        } catch (error) {
            console.error(`❌ Database connection attempt ${i + 1} failed:`, error.message);
            if (i < retries - 1) {
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            } else {
                console.error('Failed to connect to database after all retries');
                return false;
            }
        }
    }
    return false;
}

// Initialize database tables
async function initDatabase() {
    try {
        // Users table with name field
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tasks table with deadline and reminder fields
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                status VARCHAR(20) DEFAULT 'To Do' CHECK(status IN ('To Do', 'In Progress', 'Done')),
                deadline TIMESTAMP,
                reminder_time TIMESTAMP,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes for better performance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
            CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
            CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
            CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        `);

        // Create updated_at trigger function
        await pool.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        // Create triggers for updated_at
        await pool.query(`
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            CREATE TRIGGER update_users_updated_at 
                BEFORE UPDATE ON users 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);

        await pool.query(`
            DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
            CREATE TRIGGER update_tasks_updated_at 
                BEFORE UPDATE ON tasks 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);

        console.log('✅ Database tables and triggers initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    }
}

// Enhanced helper function to run queries with promises
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                reject(err);
            } else {
                resolve({ 
                    id: result.rows[0]?.id, 
                    changes: result.rowCount,
                    rows: result.rows 
                });
            }
        });
    });
}

// Enhanced helper function to get single row
function getRow(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                reject(err);
            } else {
                resolve(result.rows[0]);
            }
        });
    });
}

// Enhanced helper function to get multiple rows
function getAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                reject(err);
            } else {
                resolve(result.rows);
            }
        });
    });
}

// Health check function
async function healthCheck() {
    try {
        const result = await pool.query('SELECT 1 as health');
        return result.rows[0]?.health === 1;
    } catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}

// Initialize database connection and tables
async function initializeDatabase() {
    const connected = await testConnection();
    if (connected) {
        await initDatabase();
    } else {
        throw new Error('Failed to establish database connection');
    }
}

// Close pool on app termination
process.on('SIGINT', async () => {
    console.log('Shutting down database connections...');
    await pool.end();
    console.log('Database connections closed');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, closing database connections...');
    await pool.end();
    console.log('Database connections closed');
    process.exit(0);
});

module.exports = {
    pool,
    runQuery,
    getRow,
    getAll,
    healthCheck,
    initializeDatabase
};
