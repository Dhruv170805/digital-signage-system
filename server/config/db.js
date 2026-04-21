const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

// Verified Hash for 'admin123'
const ADMIN_HASH = '$2b$10$jIz84g7ajsbO4QK3C3Qmb.vsjV6o4yFFTYCaFexHeLP20rr22c8VC';

// Wrapper to mimic mysql2 promise-based [rows, fields] interface
const pool = {
    execute: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            const trimmedSql = sql.trim().toLowerCase();
            if (trimmedSql.startsWith('select')) {
                db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve([rows, null]);
                });
            } else {
                db.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve([{ insertId: this.lastID, affectedRows: this.changes }, null]);
                });
            }
        });
    },
    query: (sql, params = []) => pool.execute(sql, params)
};

const seedDatabase = async () => {
    try {
        console.log('💎 NEXUS CORE: Initializing SQLite Schema...');

        // 1. Users Table
        await pool.execute(`CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            status TEXT DEFAULT 'active',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 2. Admin User
        const [users] = await pool.execute('SELECT * FROM Users WHERE email = ?', ['admin@corp.in']);
        if (users.length === 0) {
            console.log('👤 Provisioning Root Admin...');
            await pool.execute('INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Root Admin', 'admin@corp.in', ADMIN_HASH, 'admin']);
        }

        // 3. System Tables
        await pool.execute('CREATE TABLE IF NOT EXISTS Screens (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, location TEXT, status TEXT DEFAULT "offline", lastPing DATETIME, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)');
        await pool.execute('CREATE TABLE IF NOT EXISTS Media (id INTEGER PRIMARY KEY AUTOINCREMENT, fileName TEXT NOT NULL, filePath TEXT NOT NULL, fileType TEXT NOT NULL, uploaderId INTEGER, status TEXT DEFAULT "pending", requestedStartTime DATETIME, requestedEndTime DATETIME, uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP)');
        
        // Repair Media table if columns missing
        try {
            await pool.execute('ALTER TABLE Media ADD COLUMN requestedStartTime DATETIME');
        } catch (e) {}
        try {
            await pool.execute('ALTER TABLE Media ADD COLUMN requestedEndTime DATETIME');
        } catch (e) {}

        await pool.execute('CREATE TABLE IF NOT EXISTS Templates (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, layout TEXT)');
        
        // 4. Schedules
        await pool.execute(`CREATE TABLE IF NOT EXISTS Schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            mediaId INTEGER, 
            templateId INTEGER, 
            screenId INTEGER,
            mediaMapping TEXT,
            startTime DATETIME NOT NULL, 
            endTime DATETIME NOT NULL, 
            duration INTEGER NOT NULL, 
            isActive INTEGER DEFAULT 1
        )`);

        // 5. Tickers
        await pool.execute('CREATE TABLE IF NOT EXISTS Tickers (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT NOT NULL, type TEXT DEFAULT "text", linkUrl TEXT, speed INTEGER DEFAULT 5, fontSize TEXT DEFAULT "text-4xl", fontStyle TEXT DEFAULT "normal", isActive INTEGER DEFAULT 1)');
        
        // Repair Tickers if columns missing (from older version)
        try {
            await pool.execute('ALTER TABLE Tickers ADD COLUMN fontSize TEXT DEFAULT "text-4xl"');
        } catch (e) {}
        try {
            await pool.execute('ALTER TABLE Tickers ADD COLUMN fontStyle TEXT DEFAULT "normal"');
        } catch (e) {}

        // 6. Settings Table
        await pool.execute('CREATE TABLE IF NOT EXISTS Settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE, value TEXT)');

        console.log('✅ NEXUS CORE: SQLite System ready.');
    } catch (err) {
        console.error('❌ NEXUS CORE: SQLite Schema Error ->', err.message);
        throw err;
    }
};

module.exports = { 
    poolPromise: (async () => {
        await seedDatabase();
        return pool;
    })() 
};
