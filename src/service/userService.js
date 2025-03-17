const userDAO = require('../repository/userDAO');
const {logger} = require("../util/logger");
const uuid = require("uuid");
const bcrypt = require("bcrypt");

async function postUser(user) {

    try {

        if(!validateUser(user)) {
            logger.info("Username and Password must be longer than 4 characters");
            throw new Error("Username and Password must be longer than 4 characters");
        }

        const existingUser = await userDAO.getUserByUsername(user.username);

        if(existingUser){
            logger.info("Username already exists");
            throw new Error("Username already exists");
        }        

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);

        const data = await userDAO.postUser({
            username: user.username,
            password: hashedPassword,
            user_id: uuid.v4(),
            role_id: "Employee"
        });

        logger.info(`User successfully created: ${user.username}`);
        return data;
    } catch (err) {
        logger.error(`Error in postUser: ${err.message}`);
        throw err;
    }    
}

async function validateLogin(username, password) {

    if (!username || !password) {
        throw new Error("Username and password are required");
    }
    const user = await userDAO.getUserByUsername(username);

    if (!user) {
        throw new Error("Invalid username or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error("Invalid username or password");
    }

    return user;
}

function validateUser(user) {
    return user.username.length > 4 && user.password.length > 4;
}

module.exports = {postUser, validateLogin}