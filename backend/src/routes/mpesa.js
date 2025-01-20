const express = require("express");
const axios = require("axios");
const moment = require("moment");
const PDFDocument = require("pdfkit"); // Install PDFKit
const fs = require("fs");
const path = require('path');
const app = express();
const db = require('../config/database'); // Assuming the database connection is in a `db.js` file
app.use(express.json()); 
const jwt = require('jsonwebtoken');
const { query } = require('../utils/dbutils');


const router = express.Router();
const ticketsDir = path.join(__dirname, '../../../public/tickets');

if (!fs.existsSync(ticketsDir)) {
    fs.mkdirSync(ticketsDir, { recursive: true });
    console.log('Tickets directory created successfully.');
}

// M-Pesa credentials
const consumerKey = "IG5GMgL8G2LR8ULOG5pL1uyeGmq2ALQi9G6c9eGEKuSRWGEX";
const consumerSecret = "n3HGgttGR5I0NjGPlQN2gfsfX1uwAnviQGecBcjoRlnbXbqTpybH6byfWjauKc0F";
const shortCode = "174379"; // Sandbox shortcode
const passKey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const callBackURL = "https://4824-196-201-224-102.ngrok-free.app/api/mpesa/callback"; // Replace with your public callback URL

// Generate a timestamp (format: YYYYMMDDHHmmss)
const generateTimestamp = () => moment().format("YYYYMMDDHHmmss");

// Generate M-Pesa password
const generatePassword = (shortCode, passKey, timestamp) =>
  Buffer.from(`${shortCode}${passKey}${timestamp}`).toString("base64");

// Generate access token
const generateAccessToken = async () => {
  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Error generating access token:", error.message);
    throw new Error("Failed to generate access token.");
  }
};

// STK Push endpoint
router.post("/pay", async (req, res) => {
  const { phoneNumber, amount, eventId, ticketType, quantity } = req.body;

  if (!phoneNumber || !/^2547\d{8}$/.test(phoneNumber)) {
    return res.status(400).json({ message: "Invalid phone number. Use the format 2547XXXXXXXX." });
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: "Amount must be a positive number." });
  }
  if (!eventId || !ticketType || !quantity) {
    return res.status(400).json({ message: "Event ID, ticket type, and quantity are required." });
  }

  try {
    // Fetch event details
    const [eventDetails] = await query("SELECT * FROM events WHERE id = ?", [eventId]);
    if (!eventDetails) {
      return res.status(404).json({ message: "Event not found." });
    }

    const [ticketDetails] = await query(
      "SELECT price FROM tickets WHERE event_id = ? AND type = ?",
      [eventId, ticketType]
  );
  if (!ticketDetails) {
      return res.status(400).json({ message: "Invalid ticket type for this event." });
  }

    // Generate timestamp, password, and access token
    const timestamp = generateTimestamp();
    const password = generatePassword(shortCode, passKey, timestamp);
    const accessToken = await generateAccessToken();

    // STK Push request
    const stkPushRequest = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: parseInt(amount, 10),
      PartyA: phoneNumber,
      PartyB: shortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: callBackURL,
      AccountReference: `Event_${eventDetails.name}`, // Event name as reference
      TransactionDesc: `Payment for ${eventDetails.name} (${ticketType})`, // Detailed description
    };

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      stkPushRequest,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    res.status(200).json({
      message: "Payment request sent. Check your phone to complete payment.",
      checkoutRequestID: response.data.CheckoutRequestID,
    });
  } catch (error) {
    console.error("M-Pesa Payment Error:", error);
    res.status(500).json({
      message: "Payment initiation failed.",
      error: error.response?.data || error.message,
    });
  }
});

// Callback endpoint for M-Pesa
router.post("/callback", async (req, res) => {
  try {
      const callbackData = req.body;
      if (callbackData.Body?.stkCallback?.ResultCode === 0) {
          const metadata = callbackData.Body.stkCallback.CallbackMetadata.Item.reduce((acc, item) => {
              acc[item.Name] = item.Value;
              return acc;
          }, {});

          const { PhoneNumber, MpesaReceiptNumber, Amount } = metadata;

          // Insert transaction and generate ticket
          const [transaction] = await query(
              "INSERT INTO eventregistrations (event_id, user_id, ticket_type, quantity, payment_ref) VALUES (?, ?, ?, ?, ?)",
              [eventId, PhoneNumber, ticketType, quantity, MpesaReceiptNumber]
          );

          const ticketId = `TICKET-${Date.now()}`;
          await generateTicket({ ...transaction, ticketId, filePath: `/tickets/${ticketId}.pdf` });

          res.status(200).json({ message: "Callback processed successfully." });
      } else {
          console.error("Payment failed:", callbackData.Body.stkCallback.ResultDesc);
          res.status(400).json({ message: "Payment failed." });
      }
  } catch (error) {
      console.error("Error processing callback:", error);
      res.status(500).json({ message: "Callback processing failed." });
  }
});


router.post("/ticket-status", async (req, res) => {
  const { phoneNumber, checkoutRequestId } = req.body;

  if (!phoneNumber || !checkoutRequestId) {
      return res.status(400).json({ message: "Invalid data in request." });
  }

  try {
      const [registration] = await query(
          "SELECT id FROM eventregistrations WHERE user_id = ? AND event_id = ?",
          [phoneNumber, checkoutRequestId]
      );

      if (!registration) {
          return res.status(404).json({ message: "No ticket found for this transaction." });
      }

      const ticketUrl = `/tickets/${registration.id}.pdf`;
      res.status(200).json({ ticketUrl });
  } catch (error) {
      console.error("Error checking ticket status:", error);
      res.status(500).json({ message: "Failed to check ticket status." });
  }
});

// Generate ticket helper function
async function generateTicket(data) {
  return new Promise((resolve, reject) => {
      try {
          const doc = new PDFDocument();
          const stream = fs.createWriteStream(data.filePath);

          doc.pipe(stream);

          // Add ticket content
          doc.fontSize(24).text("Event Ticket", { align: "center" });
          doc.moveDown();
          doc.fontSize(12);
          doc.text(`Ticket ID: ${data.ticketId}`);
          doc.text(`Event ID: ${data.eventId}`);
          doc.text(`Ticket Type: ${data.ticketType}`);
          doc.text(`Quantity: ${data.quantity}`);
          doc.text(`Amount Paid: KES ${data.amount}`);
          doc.text(`Phone Number: ${data.phoneNumber}`);
          doc.text(`M-Pesa Receipt: ${data.receiptNumber}`);
          doc.text(`Issue Date: ${new Date().toLocaleString()}`);

          // Add QR code or barcode here if needed

          doc.end();

          stream.on("finish", resolve);
          stream.on("error", reject);
      } catch (error) {
          reject(error);
      }
  });
}
module.exports = router;
