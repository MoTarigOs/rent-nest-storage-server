const express = require('express');
const verifyJWT = require('../Middleware/VerifyJWTMD.js');
const verifyAdmin = require('../Middleware/VerifyIsAdmin.js');
const { deletePropertyFilesAdmin, deleteMultiplePropertiesFilesAdmin, getFolderSizeAdmin, getAllFilenamesAdmin, deletePropertySpecificFilesAdmin, deleteFileAdmin, deletePropertySpecificFileAdmin } = require('../Controllers/AdminController.js');
const router = express.Router();

router.delete('/property-files/:propertyId', verifyJWT, verifyAdmin, deletePropertyFilesAdmin);

router.delete('/multiple-properties-files/:userId', verifyJWT, verifyAdmin, deleteMultiplePropertiesFilesAdmin);

router.post('/specific-property-files/:propertyId', verifyJWT, verifyAdmin, deletePropertySpecificFilesAdmin);

router.delete('/file/:filename', verifyJWT, verifyAdmin, deleteFileAdmin);

router.get('/folder-size', verifyJWT, verifyAdmin, getFolderSizeAdmin);

router.get('/all-files', verifyJWT, verifyAdmin, getAllFilenamesAdmin);

module.exports = router;