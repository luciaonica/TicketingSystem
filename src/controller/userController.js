const express = require('express');
const {logger} = require('../util/logger');
const userService = require("../service/userService");
const jwt = require("jsonwebtoken");
const multer = require('multer');

const {uploadProfilePictureToS3} = require("../util/s3Uploader");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

router.post("/images", authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const user_id = req.user.user_id;

        // Upload file using the utility function
        const uploadResult = await uploadProfilePictureToS3(req.file, user_id);
        const result = await userService.updateUserPicture(user_id, uploadResult);

        res.status(200).json({ message: "File uploaded successfully", fileUrl: uploadResult.fileUrl, user: result.updatedUser });
    } catch (error) {
        res.status(500).json({ error: "File upload failed", details: error.message });
    }
})

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

module.exports = router