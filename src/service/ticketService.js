const ticketDAO = require("../repository/ticketDAO");
const uuid = require("uuid");
const {logger} = require("../util/logger");

async function createTicket(ticket) {
    try {
        if(ticket.amount <= 0){
            logger.info("Amount cannot be negative");
            throw new Error("Amount cannot be negative");
        }
    
        const data = {
            ...ticket,
            ticket_id: uuid.v4(),
            status: "Pending"
        }  
        const result = await ticketDAO.createTicket(data);
        
        logger.info("Ticket successfully created", data.ticket_id);
        return result;           
    
    } catch (err) {
        logger.error(`Error in createTicket: ${err.message}`);
        throw err;
    }     
}

async function getPendingTickets(user) {    

    try {
        const tickets = await ticketDAO.getTicketsByStatus("Pending");
        logger.info(`Service: Retrieved ${tickets.length} pending tickets`);
        return tickets;
    } catch (err) {
        logger.error(`Error in getPendingTickets: ${err.message}`);
        throw err;
    }
}

async function processTicket(ticket_id, status, resolver) {
    try {
        const ticket = await ticketDAO.getTicketById(ticket_id);        

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        if (ticket.status !== "Pending") {
            throw new Error("Ticket already processed");
        }

        const updatedTicket = await ticketDAO.updateTicket(ticket_id, status, resolver);

        return updatedTicket;
    } catch (err) {
        logger.error(`Error processing ticket ${ticket_id}: ${err.message}`);
        throw err;
    }
}

async function getAllTickets(user) {
    try {
        if (user.role_id === "Manager") {
            return await ticketDAO.getAllTickets();
        } else {
            return await ticketDAO.getTicketsByEmployee(user.user_id);            
        }
    } catch (err) {
        logger.error(`Service: Error retrieving tickets: ${err.message}`);
        throw err;
    }
   
}

module.exports = { createTicket, getPendingTickets, processTicket, getAllTickets }