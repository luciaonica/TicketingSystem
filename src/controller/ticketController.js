const express = require('express');
const jwt = require("jsonwebtoken");
const ticketService = require("../service/ticketService");
const {logger} = require("../util/logger");

const router = express.Router();

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
        res.status(200).json(ticket);
    } catch (err) {
        logger.error(`Error processing ticket ${ticket_id}: ${err.message}`);
        if (err.message.includes("not found")) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        if (err.message.includes("already processed")) {
            return res.status(409).json({ error: "Ticket already processed" });
        }

        res.status(400).json({ error: err.message });
    }
})

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
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
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