const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, '..', 'data', 'task_manager.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
    }
});

// Enable WAL mode for better performance and concurrency
db.run('PRAGMA journal_mode = WAL;');
db.run('PRAGMA synchronous = NORMAL;');
db.run('PRAGMA cache_size = 1000;');
db.run('PRAGMA foreign_keys = ON;');

// Test database connection with retry logic
async function testConnection(retries = 5, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            await new Promise((resolve, reject) => {
                db.get('SELECT 1 as health', (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            console.log('✅ SQLite database connection test passed');
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

// Initialize database tables with safe migrations
async function initDatabase() {
    try {
        // Users table
        await runQuery(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tasks table (create minimal shape first)
        await runQuery(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'To Do',
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure required columns exist (deadline, reminder_time)
        const taskColumns = await getAll('PRAGMA table_info(tasks)');
        const columnNames = new Set(taskColumns.map(c => c.name));
        if (!columnNames.has('deadline')) {
            await runQuery('ALTER TABLE tasks ADD COLUMN deadline DATETIME');
        }
        if (!columnNames.has('reminder_time')) {
            await runQuery('ALTER TABLE tasks ADD COLUMN reminder_time DATETIME');
        }
        if (!columnNames.has('status')) {
            await runQuery("ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'To Do'");
        }

        // Create indexes for better performance (skip deadline index if column missing - but ensured above)
        await runQuery('CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');

        // Note: We intentionally avoid recursive update triggers in SQLite
        console.log('✅ Database initialized and migrated successfully');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    }
}

// Enhanced helper function to run queries with promises
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                console.error('Database query error:', err);
                reject(err);
            } else {
                resolve({ 
                    id: this.lastID, 
                    changes: this.changes,
                    rows: [] 
                });
            }
        });
    });
}

// Enhanced helper function to get single row
function getRow(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                console.error('Database query error:', err);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Enhanced helper function to get multiple rows
function getAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error('Database query error:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Health check function
async function healthCheck() {
    try {
        const result = await getRow('SELECT 1 as health');
        return result?.health === 1;
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

// Close database on app termination
process.on('SIGINT', () => {
    console.log('Shutting down database connections...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, closing database connections...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

module.exports = {
    db,
    runQuery,
    getRow,
    getAll,
    healthCheck,
    initializeDatabase
};