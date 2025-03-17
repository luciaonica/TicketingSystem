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
        logger.error(err.name);
        throw new Error("DAO: failed to register ticket");
    }    
}

module.exports = { createTicket}