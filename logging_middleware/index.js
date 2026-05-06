const axios = require('axios');
const { getAuthToken } = require('./auth');

/**
 * Reusable Logging function
 * @param {string} stack - "backend" or "frontend"
 * @param {string} level - "debug", "info", "warn", "error", "fatal"
 * @param {string} pkg - Package name (e.g., "handler", "db", "api")
 * @param {string} message - Descriptive log message
 */
async function Log(stack, level, pkg, message) {
    try {
        const token = await getAuthToken();
        
        const logData = {
            stack,
            level,
            "package": pkg, // 'package' is a reserved word in JS
            message
        };

        const response = await axios.post('http://20.207.122.201/evaluation-service/logs', logData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // For verification during development
        // console.log(`[LOG SERVER RESPONSE]: ${response.data.message} (${response.data.logID})`);
        
        return response.data;
    } catch (error) {
        // In case of error in logging, we fallback to a safe console.error 
        // to avoid silent failures in the middleware itself.
        console.error("Logging Middleware Error:", error.response ? error.response.data : error.message);
    }
}

module.exports = { Log };
