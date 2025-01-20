const bcrypt = require('bcryptjs');
const db = require('../config/database');
const jwt = require('jsonwebtoken');

// Register User Function
const registerUser = (req, res) => {
    const { username, email, password, role } = req.body;

    // Validate input
    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate role
    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role selected' });
    }

    // Hash the password
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ message: 'Error hashing password' });
        }

        // Insert the user into the database
        const query = 'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)';
        db.query(query, [username, email, hash, role], (err) => {
            if (err) {
                console.error('Database error:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'Username or email already exists' });
                }
                return res.status(500).json({ message: 'Database error occurred' });
            }

            res.status(201).json({ message: 'User registered successfully' });
        });
    });
};


// Login User Function
const loginUser = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ message: 'Database error occurred' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Create JWT token
        const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '1h' });

        // Send response with the token
        return res.status(200).json({
            message: 'Login successful!',
            token,
            role: user.role, // Send the user's role
            user: { username: user.username, email: user.email }
        });
    });
};


module.exports = { registerUser, loginUser };
