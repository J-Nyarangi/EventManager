const mysql = require('mysql2');

const db = mysql.createPool({
    host: '127.0.0.1',       // Database host
    user: 'root',            // Database username
    password: 'Truphy@11343', // Database password
    database: 'eventmanagement', // Database name
    waitForConnections: true,  // Wait for a connection if none are available
    connectionLimit: 10,       // Max concurrent connections
    queueLimit: 0,             // No limit on request queue
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
