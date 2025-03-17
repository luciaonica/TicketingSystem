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
        res.status(400).json(err.message);
    }
});

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