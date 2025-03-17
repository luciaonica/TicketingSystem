const {DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const {logger} = require("../util/logger");

const client = new DynamoDBClient({region: "us-east-2"});
const documentClient = DynamoDBDocumentClient.from(client);

const TableName = "Employees";
const IndexName = "username-index";

async function postUser(user) {
    const command = new PutCommand({
        TableName,
        Item: user
    });

    try {
        const data = await documentClient.send(command);
        logger.info(`PUT command to database complete ${JSON.stringify(data)}`);
       
        return user;
    } catch(err) {
        logger.error(err.name);
        throw new Error("DAO: failed to register user");
    }
}

async function getUserByUsername(username) {
    const command = new QueryCommand({
        TableName,
        IndexName,  // Use the GSI
        KeyConditionExpression: "username = :u",
        ExpressionAttributeValues: {
            ":u": username
        }
    });

    try {
        const { Items } = await documentClient.send(command);
        if (Items.length == 0) {
            return null;
        }
        logger.info(`Query command to database complete ${JSON.stringify({user_id: Items[0].user_id, username: Items[0].username, role: Items[0].role_id})}`);
        return Items[0];  // Return first match
    } catch (err) {
        console.error("Error querying by username:", err);
        throw new Error("DAO: Query command failed");
    }
}

module.exports = {postUser, getUserByUsername}