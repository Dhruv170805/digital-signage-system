/**
 * @file launcher.js
 * @description Primary Desktop Entry Point for the Nexus Digital Signage System.
 * Handles lifecycle management including update checks, database verification, and server orchestration.
 * @author Nexus Engineering
 * @version 1.0.0
 */

const { exec } = require('child_process');
const path = require('path');
const http = require('http');
const open = require('open');
const fs = require('fs');
const axios = require('axios');

/**
 * @constant {string} CURRENT_VERSION - Current semantic version of the local installation.
 * @constant {string} PORT - The network port on which the signage engine will listen.
 */
const CURRENT_VERSION = '1.0.0';
const UPDATE_CHECK_URL = 'https://api.yourdomain.com/signage/version';
const PORT = process.env.PORT || 5006;
const URL = `http://localhost:${PORT}`;

/**
 * Orchestrates the system startup sequence.
 */
async function bootstrap() {
    console.log(`
    ==================================================
    🚀 NEXUS SYSTEM INITIALIZATION
    Version: ${CURRENT_VERSION} | Environment: Production
    ==================================================
    `);

    try {
        await verifyUpdateAvailability();
        const dbStatus = await validateDatabaseEngine();
        
        if (dbStatus) {
            startSignageEngine();
        } else {
            console.error('🛑 Critical Failure: Database engine unreachable.');
            process.exit(1);
        }
    } catch (error) {
        console.error('🛑 Bootstrap Exception:', error.message);
        process.exit(1);
    }
}

/**
 * Communicates with the remote update server to check for higher versions.
 * @returns {Promise<void>}
 */
async function verifyUpdateAvailability() {
    console.log('📡 [UPDATE] Synchronizing with remote repository...');
    try {
        const { data } = await axios.get(UPDATE_CHECK_URL, { timeout: 3000 });
        if (data.version !== CURRENT_VERSION) {
            console.log(`✨ [UPDATE] New version available: v${data.version}`);
            await open(data.updateUrl);
        } else {
            console.log('✅ [UPDATE] System is running the latest verified build.');
        }
    } catch (err) {
        console.log('ℹ️ [UPDATE] Update server unreachable. Bypassing check.');
    }
}

/**
 * Ensures MongoDB is active. Attempts to invoke the system service if down.
 * @returns {Promise<boolean>}
 */
function validateDatabaseEngine() {
    return new Promise((resolve) => {
        console.log('🔍 [DB] Validating local MongoDB instance...');
        const client = require('net').connect(27017, 'localhost', () => {
            client.end();
            console.log('✅ [DB] Connection established.');
            resolve(true);
        });

        client.on('error', () => {
            console.log('⚠️ [DB] MongoDB not detected. Attempting automated service invocation...');
            const startCmd = process.platform === 'win32' ? 'net start MongoDB' : 'brew services start mongodb-community';
            
            exec(startCmd, (err) => {
                if (err) {
                    console.error('❌ [DB] Auto-start failed. Technical intervention required.');
                    resolve(false);
                } else {
                    console.log('🚀 [DB] Service started successfully.');
                    resolve(true);
                }
            });
        });
    });
}

/**
 * Initializes the Node.js Express server and opens the user interface.
 */
function startSignageEngine() {
    console.log(`📡 [ENGINE] Bootstrapping Express Core on port ${PORT}...`);
    
    try {
        const app = require('./server/src/app');
        const server = http.createServer(app);
        
        server.listen(PORT, () => {
            console.log(`\n🟢 NEXUS IS ONLINE: ${URL}`);
            console.log('🌍 Launching user interface...');
            open(URL);
        });
    } catch (err) {
        console.error('❌ [ENGINE] Startup crash:', err.message);
        process.exit(1);
    }
}

// Execute the bootstrap sequence
bootstrap();
