const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_SERVER || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Verified Hash for 'admin123'
const ADMIN_HASH = '$2b$10$jIz84g7ajsbO4QK3C3Qmb.vsjV6o4yFFTYCaFexHeLP20rr22c8VC';

// Simulation Mode Implementation
const mockPool = {
    execute: async (q, params) => {
        console.log('🛠️ [SIMULATION] Query:', q, '| Params:', params);
        if (q.includes('SELECT * FROM Users WHERE email = ?')) {
            if (params[0] === 'admin@corp.in') {
                return [[{ id: 1, name: 'Admin', email: 'admin@corp.in', password: ADMIN_HASH, role: 'admin', status: 'active' }], []];
            }
        }
        if (q.includes('SELECT') && q.includes('FROM Users')) return [[{ id: 1, name: 'Admin', email: 'admin@corp.in', role: 'admin', status: 'active' }], []];
        if (q.includes('SELECT COUNT(*)')) return [[{ count: 0 }], []];
        if (q.includes('SELECT * FROM Screens')) return [[{ id: 1, name: 'Demo Screen', location: 'Lobby', status: 'online' }], []];
        if (q.includes('SELECT * FROM Tickers')) return [[], []];
        return [[], []];
    },
    query: async (q, params) => [[], []],
    getConnection: async () => ({ release: () => {}, execute: async () => [[], []] })
};

const pool = mysql.createPool(dbConfig);

let seedingPromise = null;

const seedDatabase = async (conn) => {
    if (seedingPromise) return seedingPromise;
    
    seedingPromise = (async () => {
        try {
            console.log('💎 NEXUS CORE: Initializing Database Schema...');
            
            // 1. Users Table
            await conn.execute(`CREATE TABLE IF NOT EXISTS Users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'admin',
                status VARCHAR(50) DEFAULT 'active',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Check columns for existing table
            const [cols] = await conn.execute("SHOW COLUMNS FROM Users");
            if (!cols.find(c => c.Field === 'name')) {
                console.log('🩹 Repairing Users table schema...');
                await conn.execute("ALTER TABLE Users ADD COLUMN name VARCHAR(255) NOT NULL AFTER id");
            }

            // 2. Admin User
            const [users] = await conn.execute('SELECT * FROM Users WHERE email = ?', ['admin@corp.in']);
            if (users.length === 0) {
                console.log('👤 Provisioning Root Admin...');
                await conn.execute('INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Root Admin', 'admin@corp.in', ADMIN_HASH, 'admin']);
            } else {
                // Update admin password to match current ADMIN_HASH to ensure login works
                console.log('👤 Updating Root Admin credentials...');
                await conn.execute('UPDATE Users SET password = ? WHERE email = ?', [ADMIN_HASH, 'admin@corp.in']);
            }

            // 3. System Tables
            await conn.execute('CREATE TABLE IF NOT EXISTS Screens (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255) NOT NULL, location VARCHAR(255), status VARCHAR(50) DEFAULT "offline", lastPing DATETIME, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)');
            await conn.execute('CREATE TABLE IF NOT EXISTS Media (id INT PRIMARY KEY AUTO_INCREMENT, fileName VARCHAR(255) NOT NULL, filePath VARCHAR(500) NOT NULL, fileType VARCHAR(50) NOT NULL, uploaderId INT, status VARCHAR(50) DEFAULT "pending", uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP)');
            await conn.execute('CREATE TABLE IF NOT EXISTS Templates (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL, layout JSON)');
            
            // 4. Schedules with screenId and mediaMapping support
            await conn.execute(`CREATE TABLE IF NOT EXISTS Schedules (
                id INT PRIMARY KEY AUTO_INCREMENT, 
                mediaId INT, 
                templateId INT, 
                screenId INT,
                mediaMapping JSON,
                startTime DATETIME NOT NULL, 
                endTime DATETIME NOT NULL, 
                duration INT NOT NULL, 
                isActive TINYINT(1) DEFAULT 1
            )`);

            // Ensure screenId and mediaMapping columns exist
            const [schedCols] = await conn.execute("SHOW COLUMNS FROM Schedules");
            if (!schedCols.find(c => c.Field === 'screenId')) {
                console.log('🩹 Repairing Schedules table (adding screenId)...');
                await conn.execute("ALTER TABLE Schedules ADD COLUMN screenId INT AFTER templateId");
            }
            if (!schedCols.find(c => c.Field === 'mediaMapping')) {
                console.log('🩹 Repairing Schedules table (adding mediaMapping)...');
                await conn.execute("ALTER TABLE Schedules ADD COLUMN mediaMapping JSON AFTER screenId");
            }

            await conn.execute('CREATE TABLE IF NOT EXISTS Tickers (id INT PRIMARY KEY AUTO_INCREMENT, text LONGTEXT NOT NULL, type VARCHAR(50) DEFAULT "text", linkUrl VARCHAR(500), speed INT DEFAULT 5, isActive TINYINT(1) DEFAULT 1)');

            console.log('✅ NEXUS CORE: System ready.');
        } catch (err) {
            console.error('❌ NEXUS CORE: Schema Error ->', err.message);
            seedingPromise = null; // Allow retry on failure
            throw err;
        }
    })();

    return seedingPromise;
};

const getPool = async () => {
    try {
        const conn = await pool.getConnection();
        await seedDatabase(conn);
        conn.release();
        return pool;
    } catch (err) {
        console.warn('⚠️ NEXUS CORE: Local MySQL unreachable. Engaging Simulation Protocol.');
        return mockPool;
    }
};

module.exports = { poolPromise: getPool() };
