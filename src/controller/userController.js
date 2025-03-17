const express = require('express');
const {logger} = require('../util/logger');
const userService = require("../service/userService");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/register", validateUserData, async (req, res) => {
    try {
        const data = await userService.postUser(req.body);
        res.status(201).json("Registration successful.");
    } catch (err) {
        logger.error(`Error registering user: ${err.message}`);
        res.status(400).json(err.message);
    }
});

router.post("/login", validateUserData, async (req, res) => {
    try {
        const {username, password} = req.body;
        const user = await userService.validateLogin(username, password);

        const token = jwt.sign(
            {
                user_id: user.user_id,
                username: user.username,
                role_id: user.role_id
            },
                process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "150m"
            }
        );
        res.status(200).json({message: "You have logged in successfylly!", token});
    } catch(err) {
        logger.error(`Login failed: ${err.message}`);
        res.status(401).json("Invalid username or password");
    }
})

function validateUserData(req, res, next) {
    const data = req.body;
    if(data.username && data.password) {
        next();
    } else {
        res.status(400).json("Username and password required");
    }
}

module.exports = router