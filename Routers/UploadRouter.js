const express = require('express');
const router = express.Router();
const multer = require('multer');
const { validPropertyId, uploadedPropertyFiles } = require('../Controllers/UploadController.js');
//const verifyJWT = require('../Middleware/VerifyJWTMD.js');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Destination folder for uploaded files
    },
    filename: (req, file, cb) => {
      cb(null,Date.now() + '-' + file.originalname.replaceAll(' ', '-')); // Rename the file to include the timestamp
    },
});

const upload = multer({ 
    storage: storage,
});

router.post('/property/:propertyId', validPropertyId, upload.array('FilesForUpload', 25), uploadedPropertyFiles);

module.exports = router;