const {S3Client, PutObjectCommand} = require("@aws-sdk/client-s3");

const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
const accessKey = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey
    },
    region: bucketRegion
});

const uploadProfilePictureToS3 = async (file, user_id) => {
    if (!file) {
        throw new Error("No file provided for upload");
    }

    const filePath = `users/${user_id}/${file.originalname}`;

    const params = {
        Bucket: bucketName,
        Key: filePath,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    try {
        const command = new PutObjectCommand(params);
        await s3.send(command);
        
        return {
            filePath,
            fileUrl: `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${filePath}`
        };
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

const uploadTicketPictureToS3 = async (file, ticket_id) => {
    if (!file) {
        throw new Error("No file provided for upload");
    }

    const filePath = `tickets/${ticket_id}/${file.originalname}`;

    const params = {
        Bucket: bucketName,
        Key: filePath,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    try {
        const command = new PutObjectCommand(params);
        await s3.send(command);
        
        return {
            filePath,
            fileUrl: `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${filePath}`
        };
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

module.exports = {uploadProfilePictureToS3, uploadTicketPictureToS3}