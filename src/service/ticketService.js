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

module.exports = { createTicket }