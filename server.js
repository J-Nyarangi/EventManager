const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./backend/src/routes/auth');
const eventsRoutes = require('./backend/src/routes/events'); // Updated path
const mpesaRoutes = require('./backend/src/routes/mpesa');
const cors = require('cors');
const app = express();
const adminRoutes = require("./backend/src/routes/admin");


app.use(cors());
// Middleware
app.use(express.json()); 
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes); // Use the updated path

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/api/mpesa', mpesaRoutes);
app.use('/tickets', express.static(path.join(__dirname, 'public/tickets')));
app.use("/api/admin", adminRoutes);
// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
