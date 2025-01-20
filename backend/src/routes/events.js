const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const db = require('../config/database');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../../public/assets/images'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
        }
    },
});

// Helper function to execute database queries with Promises
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = await query('SELECT * FROM events');
        res.status(200).json(events);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ message: 'Failed to fetch events' });
    }
});

// Create a new event
router.post('/', upload.single('banner_image'), (req, res) => {
    const { name, date, category, location, capacity, tickets } = req.body;
    const bannerImage = req.file ? `/assets/images/${req.file.filename}` : null;

    if (!name || !date || !category || !location || !capacity) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const parsedTickets = tickets ? JSON.parse(tickets) : []; // Parse tickets JSON string

    db.query(
        'INSERT INTO events (name, date, category, location, capacity, banner_image) VALUES (?, ?, ?, ?, ?, ?)',
        [name, date, category, location, capacity, bannerImage],
        (err, result) => {
            if (err) {
                console.error('Error saving event:', err.message);
                return res.status(500).json({ message: 'Failed to save event' });
            }

            const eventId = result.insertId;

            // Insert tickets into the tickets table
            const ticketPromises = parsedTickets.map((ticket) => {
                return new Promise((resolve, reject) => {
                    db.query(
                        'INSERT INTO tickets (event_id, type, price, quantity) VALUES (?, ?, ?, ?)',
                        [eventId, ticket.type, ticket.price, ticket.quantity],
                        (err) => {
                            if (err) return reject(err);
                            resolve();
                        }
                    );
                });
            });

            Promise.all(ticketPromises)
                .then(() => {
                    res.status(201).json({
                        id: eventId,
                        name,
                        date,
                        category,
                        location,
                        capacity,
                        banner_image: bannerImage,
                        tickets: parsedTickets,
                    });
                })
                .catch((err) => {
                    console.error('Error saving tickets:', err);
                    res.status(500).json({ message: 'Failed to save tickets' });
                });
        }
    );
});


// Update an event
router.put('/:id', upload.single('banner_image'), async (req, res) => {
    const { id } = req.params;
    const { name, date, category, location, capacity, tickets } = req.body;
    const bannerImage = req.file ? `/assets/images/${req.file.filename}` : null;

    const updateQuery = bannerImage
        ? 'UPDATE events SET name = ?, date = ?, category = ?, location = ?, capacity = ?, banner_image = ? WHERE id = ?'
        : 'UPDATE events SET name = ?, date = ?, category = ?, location = ?, capacity = ? WHERE id = ?';

    const queryParams = bannerImage
        ? [name, date, category, location, capacity, bannerImage, id]
        : [name, date, category, location, capacity, id];

    try {
        await query(updateQuery, queryParams);

        // Update tickets
        const parsedTickets = tickets ? JSON.parse(tickets) : [];
        await query('DELETE FROM tickets WHERE event_id = ?', [id]);

        if (parsedTickets.length > 0) {
            const ticketValues = parsedTickets.map(ticket => [id, ticket.type, ticket.price, ticket.quantity]);
            await query('INSERT INTO tickets (event_id, type, price, quantity) VALUES ?', [ticketValues]);
        }

        res.status(200).json({
            message: 'Event updated successfully',
            tickets: parsedTickets,
        });
    } catch (err) {
        console.error('Error updating event:', err);
        res.status(500).json({ message: 'Failed to update event' });
    }
});

// Delete an event
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await query('DELETE FROM events WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error('Error deleting event:', err);
        res.status(500).json({ message: 'Failed to delete event' });
    }
});

// Get an event by ID (with tickets and stats)
router.get('/:id', (req, res) => {
    const { id } = req.params;

    // Fetch event details
    db.query('SELECT * FROM events WHERE id = ?', [id], (err, rows) => {
        if (err) {
            console.error('Error fetching event:', err);
            return res.status(500).json({ message: 'Failed to fetch event' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const event = rows[0];

        // Fetch tickets and registered attendees
        const ticketQuery = `
            SELECT type, price, quantity
            FROM tickets
            WHERE event_id = ?`;

        const registeredQuery = `
            SELECT COALESCE(SUM(quantity), 0) AS registered
            FROM eventregistrations
            WHERE event_id = ?`;

        db.query(ticketQuery, [id], (ticketErr, ticketRows) => {
            if (ticketErr) {
                console.error('Error fetching tickets:', ticketErr);
                return res.status(500).json({ message: 'Failed to fetch tickets' });
            }

            event.tickets = ticketRows;

            db.query(registeredQuery, [id], (regErr, regRows) => {
                if (regErr) {
                    console.error('Error fetching registrations:', regErr);
                    return res.status(500).json({ message: 'Failed to fetch registrations' });
                }

                const registeredCount = regRows[0].registered || 0;
                event.registered = registeredCount;
                event.available = Math.max(event.capacity - registeredCount, 0); // Ensure available doesn't go negative

                res.status(200).json(event);
            });
        });
    });
});

// Register a user for an event
router.post('/registrations', (req, res) => {
    const { eventId, phoneNumber, ticketType, quantity } = req.body;

    if (!eventId || !phoneNumber || !ticketType || !quantity) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    db.query(
        'INSERT INTO eventregistrations (event_id, user_id, ticket_type, quantity) VALUES (?, ?, ?, ?)',
        [eventId, phoneNumber, ticketType, quantity],
        (err, result) => {
            if (err) {
                console.error('Error registering user:', err);
                return res.status(500).json({ message: 'Failed to register user.' });
            }

            res.status(201).json({ message: 'User successfully registered for the event.' });
        }
    );
});

module.exports = router;


