const {DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
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

async function updateUserPicture(user_id, image) {
    const user = await getUserById(user_id);

    if(!user) {
        throw new Error ("user not found");
    }
    
    const command = new UpdateCommand({
        TableName,
        Key: { user_id },  
        UpdateExpression: "SET #i = :image",
        ExpressionAttributeNames: {
            "#i": "image"
        },
        ExpressionAttributeValues: {
            ":image": image
        },
        ReturnValues: "ALL_NEW"  
    });

    try {
        const { Attributes } = await documentClient.send(command);
        
        return {user_id: Attributes.user_id, image: Attributes.image}; 
    } catch (err) {
        console.error("Error updating user image:", err);
        return null;
    }
}

async function getUserById(user_id){
    const getCommand = new GetCommand({
        TableName,
        Key: { user_id: user_id } 
    });

    try {
        const response = await documentClient.send(getCommand);
        if(!response.Item) {
            throw new Error("User not found")
        }

        return response.Item;  
    } catch (err) {
        logger.error(`Error fetching user ${user_id}: ${err.message}`);
        throw new Error(`DAO: Failed to fetch ticket ${user_id} - ${err.message}`);
    }
}

module.exports = {postUser, getUserByUsername, updateUserPicture}