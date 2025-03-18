const {DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, QueryCommand, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const {logger} = require("../util/logger");

const client = new DynamoDBClient({region: "us-east-2"});
const documentClient = DynamoDBDocumentClient.from(client);

const TableName = "Tickets";

async function createTicket(ticket) {
    const command = new PutCommand({
        TableName,
        Item: ticket
    });

    try {
        await documentClient.send(command);
        logger.info(`PUT command to database complete ${ticket.ticket_id}`);
        return ticket;
    } catch (err) {
        logger.error(`Error creating ticket: ${err.message}`);
        throw new Error(`DAO: Failed to register ticket - ${err.message}`);
    }    
}

async function getTicketsByStatus(status) {
    
    const command = new QueryCommand({
        TableName,
        IndexName: "status-index",
        KeyConditionExpression: "#s = :s",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": status }
    });

    try {
        const { Items } = await documentClient.send(command);
        logger.info(`DAO: Retrieved ${Items.length} tickets with status ${status}`);
        return Items;
    } catch (err) {
        logger.error(`Error fetching tickets by status ${status}: ${err.message}`);
        throw new Error(`DAO: Failed to retrieve tickets by status - ${err.message}`);
    }
}

async function updateTicket(ticket_id, status, resolver) {
    const command = new UpdateCommand({
        TableName,
        Key: { ticket_id },
        UpdateExpression: "SET #s = :status, #resolver = :resolver",
        ExpressionAttributeNames: { "#s": "status", "#resolver": "resolver" },
        ExpressionAttributeValues: { ":status": status, ":resolver": resolver },
        ReturnValues: "ALL_NEW",
    });

    try {   
        const { Attributes } = await documentClient.send(command);

        if (!Attributes) {
            throw new Error("Ticket not found");
        }

        return Attributes; 
    } catch (err) {
        logger.error(`Error updating ticket ${ticket_id}: ${err.message}`);
        throw new Error(`DAO: Failed to update ticket ${ticket_id} - ${err.message}`);
    }
}

async function getTicketById(ticket_id){
    const getCommand = new GetCommand({
        TableName,
        Key: { ticket_id } 
    });

    try {
        const response = await documentClient.send(getCommand);
        if(!response.Item) {
            throw new Error("Ticket not found")
        }

        return response.Item;
    } catch (err) {
        logger.error(`Error fetching ticket ${ticket_id}: ${err.message}`);
        throw new Error(`DAO: Failed to fetch ticket ${ticket_id} - ${err.message}`);
    }
}

module.exports = { createTicket, getTicketsByStatus, updateTicket, getTicketById}