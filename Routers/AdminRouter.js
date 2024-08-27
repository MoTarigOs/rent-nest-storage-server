const express = require('express');
const verifyJWT = require('../Middleware/VerifyJWTMD.js');
const verifyAdmin = require('../Middleware/VerifyIsAdmin.js');
const { deletePropertyFilesAdmin, deleteMultiplePropertiesFilesAdmin, getFolderSizeAdmin, getAllFilenamesAdmin, deletePropertySpecificFilesAdmin, deleteFileAdmin, deletePropertySpecificFileAdmin, validPropertyIdForAddAdmin, addPropertyFilesAdmin } = require('../Controllers/AdminController.js');
const router = express.Router();
const multer = require('multer');
const { getValidFilename, maxStorageSize, maxVideoSize } = require('../utils/logic.js');
const scanFiles = require('../Middleware/ScanUploadedFiles.js');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      console.log('---------- dest');
      cb(null, 'uploads/'); // Destination folder for uploaded files
    },
    filename: (req, file, cb) => {
      console.log('---------- multer file: ', file);
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


router.delete('/property-files/:propertyId', verifyJWT, verifyAdmin, deletePropertyFilesAdmin);

router.delete('/multiple-properties-files/:userId', verifyJWT, verifyAdmin, deleteMultiplePropertiesFilesAdmin);

router.post('/specific-property-files/:propertyId', verifyJWT, verifyAdmin, deletePropertySpecificFilesAdmin);

router.delete('/file/:filename', verifyJWT, verifyAdmin, deleteFileAdmin);

router.get('/folder-size', verifyJWT, verifyAdmin, getFolderSizeAdmin);

router.get('/all-files', verifyJWT, verifyAdmin, getAllFilenamesAdmin);

router.post('/property/:propertyId', verifyJWT, verifyAdmin, validPropertyIdForAddAdmin, function (req, res, next) {
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
}, scanFiles, addPropertyFilesAdmin);

module.exports = router;