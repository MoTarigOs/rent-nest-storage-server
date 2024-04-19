const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { addPropertyFiles, validPropertyIdForAdd } = require('../Controllers/UploadController.js');
const scanFiles = require('../Middleware/ScanUploadedFiles.js');
const verifyJWT = require('../Middleware/VerifyJWTMD.js');
const { getValidFilename, maxVideoSize, maxStorageSize } = require('../utils/logic.js');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      console.log('dest: ', path.join(__dirname, '..', 'uploads'));
      cb(null, path.join(__dirname, '..', 'uploads')); // Destination folder for uploaded files
    },
    filename: (req, file, cb) => {
      console.log('multer file: ', file);
      cb(null, Date.now() + '-' + getValidFilename(file?.originalname?.replaceAll(' ', '-')));
    },
});

const upload = multer({ 
    storage: storage,
    limits: {
      fieldSize: maxStorageSize,
      fields: 1,
      files: 50,
      parts: 50,
      fileSize: maxVideoSize,
    },
    fileFilter: function (req, file, cb) {

      console.log('check file filter: ', file);

      if(file.mimetype !== 'image/png' 
      && file.mimetype !== 'image/jpeg'
      && file.mimetype !== 'video/mp4' 
      && file.mimetype !== 'video/avi'){
        cb(null, false);
      };

      cb(null, true);

    }
}).array('FilesForUpload', 25);

router.post('/property/:propertyId', verifyJWT, validPropertyIdForAdd, function (req, res, next) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      console.log('upload error: ', err);
      return res.status(500).json({ message: 'upload error'});
    } else if (err) {
      // An unknown error occurred when uploading.
      console.log('server error: ', err);
      return res.status(500).json({ message: 'server error'});
    }
    // Everything went fine.
    next();
  })
}, scanFiles, addPropertyFiles);

// router.post('/property-add/:propertyId', verifyJWT, function (req, res, next) {
//   upload(req, res, function (err) {
//     if (err instanceof multer.MulterError) {
//       // A Multer error occurred when uploading.
//       console.log(err.message);
//       return res.status(501).json({ message: 'upload error'});
//     } else if (err) {
//       // An unknown error occurred when uploading.
//       console.log(err.message);
//       return res.status(501).json({ message: 'unknown error'});
//     }
//     // Everything went fine.
//     next();
//   })
// }, scanFiles, addPropertyFiles)

module.exports = router;