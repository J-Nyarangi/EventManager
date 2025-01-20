const mysql = require('mysql2');
require('dotenv').config();


// Use Railway-provided environment variables for MySQL
const db = mysql.createPool({
    host: process.env.MYSQLHOST || 'localhost',      // Host from Railway
    user: process.env.MYSQLUSER || 'root',          // User from Railway
    password: process.env.MYSQLPASSWORD || '',      // Password from Railway
    database: process.env.MYSQLDATABASE || '',      // Database name from Railway
    port: process.env.MYSQLPORT || 3306,            // Port from Railway (default: 3306)
    waitForConnections: true,                       // Wait for connections if unavailable
    connectionLimit: 10,                            // Maximum concurrent connections
    queueLimit: 0                                   // No limit on request queue
});

// Test the connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        throw err;
    }
    console.log('Connected to MySQL Database using Pool');
    if (connection) connection.release(); // Release the connection back to the pool
});

module.exports = db;
