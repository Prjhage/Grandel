const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../login-debug.log');

module.exports = function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    try {
        fs.appendFileSync(logFilePath, logMessage);
    } catch (err) {
        console.error("Failed to write to log file:", err);
    }
};
