const express = require('express');
const jwt = require("jsonwebtoken");
const ticketService = require("../service/ticketService");
const {logger} = require("../util/logger");

const multer = require('multer');

const {uploadTicketPictureToS3} = require("../util/s3Uploader");
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

const router = express.Router();

router.post("/images", authenticateToken, upload.single('file'), async (req, res) => {
    try {

        const ticket_id = req.body.ticket_id;

        // Upload file using the utility function
        const uploadResult = await uploadTicketPictureToS3(req.file, ticket_id);
        const result = await ticketService.updateTicketImage(ticket_id, uploadResult);

        res.status(200).json({ message: "File uploaded successfully", fileUrl: uploadResult.fileUrl, ticket: result.updatedTicket });
    } catch (error) {
        res.status(500).json({ error: "File upload failed", details: error.message });
    }
})

router.post("/", authenticateToken, validateTicketMiddleware, async (req,res) => {
    
    try{
        const ticket = req.body;
    
        ticket.author = req.user.user_id;

        const result = await ticketService.createTicket(ticket);
        res.status(201).json({message: "Ticket created", ticket: result});
    } catch (err) {
        logger.error(`Error creating ticket: ${err.message}`);
        res.status(400).json({ error: err.message });
    }
});

router.get("/pending", authenticateToken, authorizeRole(["Manager"]), async (req, res) => {
    try {
        const tickets = await ticketService.getPendingTickets(req.user);
        res.status(200).json(tickets);
    } catch (err) {
        logger.error(`Error retrieving pending tickets: ${err.message}`);
        res.status(403).json({ error: err.message });
    }
});

router.put("/:id", authenticateToken, authorizeRole(["Manager"]), async (req, res) => {

    const ticket_id = req.params.id;
    const status = req.query.status;   
    const resolver = req.user.user_id;

    try {
        const ticket = await ticketService.processTicket(ticket_id, status, resolver);
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }
        res.status(200).json(ticket);
    } catch (err) {
        logger.error(`Error processing ticket ${ticket_id}: ${err.message}`);
        if (err.message.includes("not found")) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        res.status(400).json({ error: err.message });
    }
});

router.get("/", authenticateToken, async (req, res) => {
    try {
        const tickets = await ticketService.getAllTickets(req.user);
        res.status(200).json(tickets);
    } catch (err) {
        logger.error(`Error retrieving tickets: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

function authorizeRole(allowedRoles) {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role_id)) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        next();
    };
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(401).json({ error: "Invalid or expired token." });
        req.user = user;
        next();
    })
}

function validateTicketMiddleware(req, res, next) {
    const jsonBody = req.body;
    if(validateTicket(jsonBody)) {
        next();
    } else {
        res.status(400).json({
            message: "Request cannot be submitted without amount or description"
        })
    }
}

function validateTicket(data) {
    return data.amount && data.description;
}

module.exports = router