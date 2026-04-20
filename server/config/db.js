const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true, // For Azure
        trustServerCertificate: true // For local dev
    }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
    })
    .catch(err => {
        console.warn('⚠️ Database Connection Failed! Running in mock/limited mode.');
        console.error('Error Details:', err.message);
        // Do not exit the process here to allow the server to start
        return null; 
    });

module.exports = {
    sql,
    poolPromise
};
