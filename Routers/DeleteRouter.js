const express = require('express');
const verifyJWT = require('../Middleware/VerifyJWTMD');
const { deletePropertyFiles, deleteMultiplePropertiesFiles, deletePropertySpecificFiles, deletePropertySpecificFile } = require('../Controllers/DeleteController');
const router = express.Router();

router.delete('/property-files/:propertyId', verifyJWT, deletePropertyFiles);

router.delete('/property-specific-file/:propertyId', verifyJWT, deletePropertySpecificFile);

router.post('/property-specific-files/:propertyId', verifyJWT, deletePropertySpecificFiles);

router.delete('/multiple-properties-files', verifyJWT, deleteMultiplePropertiesFiles);

module.exports = router;