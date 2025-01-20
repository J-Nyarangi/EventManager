const express = require("express");
const router = express.Router();
const db = require("../config/database");

// Get dashboard stats
router.get("/dashboard-stats", async (req, res) => {
    try {
        const [eventsCount] = await db.promise().query("SELECT COUNT(*) AS total_events FROM events");
        //const [ticketsSold] = await db.promise().query("SELECT COALESCE(SUM(quantity), 0) AS total_tickets_sold FROM registrations");
        const [usersCount] = await db.promise().query("SELECT COUNT(*) AS total_users FROM users");
        //const [revenue] = await db.promise().query("SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM payments");

        res.status(200).json({
            totalEvents: eventsCount[0].total_events,
            //ticketsSold: ticketsSold[0].total_tickets_sold,
            totalUsers: usersCount[0].total_users,
            //revenue: revenue[0].total_revenue,
        });
    } catch (err) {
        console.error("Error fetching stats:", err);
        res.status(500).json({ message: "Failed to fetch stats." });
    }
});

// Get recent events
router.get("/recent-events", async (req, res) => {
    try {
        const [recentEvents] = await db.promise().query(
            "SELECT id, name, date, location, banner_image, status FROM events ORDER BY date DESC LIMIT 5"
        );

        res.status(200).json(recentEvents);
    } catch (err) {
        console.error("Error fetching recent events:", err);
        res.status(500).json({ message: "Failed to fetch recent events." });
    }
});

// Get recent transactions
/* router.get("/recent-transactions", async (req, res) => {
    try {
        const [transactions] = await db.promise().query(
            `SELECT 
                t.id AS transaction_id, 
                u.name AS customer_name, 
                e.name AS event_name, 
                t.date AS transaction_date, 
                t.amount, 
                t.status 
             FROM transactions t
             JOIN users u ON t.user_id = u.id
             JOIN events e ON t.event_id = e.id
             ORDER BY t.date DESC LIMIT 5`
        );

        res.status(200).json(transactions);
    } catch (err) {
        console.error("Error fetching transactions:", err);
        res.status(500).json({ message: "Failed to fetch recent transactions." });
    }
});*/

// Get ticket sales stats
router.get("/ticket-sales", async (req, res) => {
    try {
        // Total tickets sold
        const [totalTickets] = await db.query(`
            SELECT SUM(quantity) AS total_tickets FROM eventregistrations
        `);

        // Total revenue
        const [totalRevenue] = await db.query(`
            SELECT SUM(quantity * price) AS revenue
            FROM eventregistrations
            JOIN tickets ON registrations.ticket_type = tickets.type
        `);

        // Recent transactions
        const [recentSales] = await db.query(`
            SELECT 
                registrations.id AS transaction_id,
                events.name AS event_name,
                registrations.user_id AS customer,
                registrations.quantity AS tickets_sold,
                tickets.price AS ticket_price,
                (registrations.quantity * tickets.price) AS total_amount,
                registrations.created_at AS transaction_date
            FROM eventregistrations
            JOIN tickets ON registrations.ticket_type = tickets.type
            JOIN events ON registrations.event_id = events.id
            ORDER BY registrations.created_at DESC
            LIMIT 10
        `);

        res.status(200).json({
            totalTickets: totalTickets.total_tickets || 0,
            totalRevenue: totalRevenue.revenue || 0,
            recentSales,
        });
    } catch (error) {
        console.error("Error fetching ticket sales:", error);
        res.status(500).json({ message: "Failed to fetch ticket sales data." });
    }
});

module.exports = router;
