// Imports / Dependencies
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
require("dotenv").config();

// Import database and routes
const { initializeDatabase, healthCheck } = require('./database');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

// Express App
const app = express();

// Enhanced security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// CORS configuration with enhanced security
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400 // 24 hours
}));

// Enhanced rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
});

app.use(limiter);

// Body parsing middleware with enhanced security
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            res.status(400).json({
                success: false,
                message: 'Invalid JSON payload',
                code: 'INVALID_JSON'
            });
            throw new Error('Invalid JSON');
        }
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Enhanced Server Health Check
app.get("/health", async (req, res) => {
    try {
        const dbHealth = await healthCheck();
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        
        res.json({
            status: dbHealth ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
            database: dbHealth ? 'connected' : 'disconnected',
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
            },
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
});

// API Info with enhanced details
app.get("/", (req, res) => {
    res.json({
        message: "Task Manager API",
        version: "1.0.0",
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: "/api/auth",
            tasks: "/api/tasks",
            health: "/health"
        },
        documentation: "API documentation available at /docs (future enhancement)",
        status: "operational"
    });
});

// 404 handler with better error details
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
        requestedUrl: req.originalUrl,
        method: req.method,
        availableEndpoints: [
            'GET /',
            'GET /health',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET /api/tasks',
            'POST /api/tasks',
            'PUT /api/tasks/:id',
            'DELETE /api/tasks/:id'
        ]
    });
});

// Enhanced global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: err.message
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
            code: 'UNAUTHORIZED'
        });
    }

    // Default error response
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message,
        code: 'INTERNAL_SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Server PORT (default 80 for container compatibility)
const PORT = process.env.PORT || 80;

// Enhanced reminder checks with better error handling
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        const result = await require('./database').getAll(
            'SELECT t.*, u.email FROM tasks t JOIN users u ON t.user_id = u.id WHERE t.reminder_time <= ? AND t.status != ?',
            [now.toISOString(), 'Done']
        );
        
        if (result.length > 0) {
            console.log(`🔔 Found ${result.length} tasks with reminders due`);
            // Here you would typically send email/SMS notifications
            // For now, just log them
            result.forEach(task => {
                console.log(`📅 Reminder: Task "${task.title}" is due for user ${task.email}`);
            });
        }
    } catch (error) {
        console.error('❌ Reminder check error:', error);
        // Don't crash the application on reminder check failure
    }
});

// Graceful shutdown with enhanced cleanup
const gracefulShutdown = async (signal) => {
    console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
    
    // Stop accepting new requests
    global.server.close(() => {
        console.log('✅ HTTP server closed');
    });
    
    // Close database connections
    try {
        require('./database').db.close();
        console.log('✅ Database connections closed');
    } catch (error) {
        console.error('❌ Error closing database connections:', error);
    }
    
    // Exit process
    console.log('👋 Graceful shutdown completed');
    process.exit(0);
};

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// Initialize database and start server
async function startServer() {
    try {
        console.log('🚀 Starting Task Manager API...');
        
        // Initialize database
        await initializeDatabase();
        console.log('✅ Database initialized successfully');
        
        // Start server
        const server = app.listen(PORT, () => {
            console.log(`🎉 Task Manager API running on PORT: ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`⏰ Started at: ${new Date().toISOString()}`);
        });
        
        // Store server reference for graceful shutdown
        global.server = server;
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
