const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const { registerUser, loginUser } = require('../controllers/auth');

// User registration route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser); // Add the login route


module.exports = router;
