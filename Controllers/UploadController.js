const { default: mongoose } = require("mongoose");
const Property = require('../Data/PropertyModel.js');

const uploadSucceed = (req, res) => {
    console.log(req.files.toString());
    return res.status(201).json({ message: 'successfully uploaded' });
};

const validPropertyId = async(req, res, next) => {

    //check if the property exist and the owner is the requester

    console.log('checking for valid property id: ', req.params.propertyId);

    if(!req || !req.user || !req.params) return res.status(403).json({ message: 'request error' });

    const { id } = req.user;

    const { propertyId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
        return res.status(403).json({ message: 'request error' });

    const property = await Property.findOne({ _id: propertyId }).select('owner_id');

    console.log('property: ', property);

    if(!property || property.owner_id.toString() !== id) return res.status(403).json({ message: 'access error' });
    
    next();

};

const validVehicleId = async(req, res, next) => {

    //check if the property exist and the owner is the requester

    next();

};

const uploadedPropertyFiles = async(req, res, next) => {

    //handle after upload for property

    const files = req.files;

    console.log('files: ', files);

    const { propertyId } = req.params;

    if(!files || files.length <= 0) return res.status(501).json({ message: 'server error' });

    //update images and videos database record

    let imagesNames = [];
    let videosNames = [];

    for (let i = 0; i < files.length; i++) {

        if(files[i].mimetype === 'video/mp4' || files[i].mimetype === 'video/avi') 
            videosNames.push(files[i].filename);

        if(files[i].mimetype === 'image/png' || files[i].mimetype === 'image/jpeg') 
            imagesNames.push(files[i].filename);

    };

    if(imagesNames.length <= 0 && videosNames.length <= 0) return res.status(501).json({ message: 'unknown error' });

    const property = await Property.updateOne({ _id: propertyId }, { images: imagesNames, videos: videosNames });

    console.log('updateOne function return: ', property);

    if(!property || property.modifiedCount < 1 || property.acknowledged === false) 
        return res.status(501).json({ message: 'unknown error' });

    return res.status(201).json({ message: 'succefully upload property images' });

};

const uploadedVehicleFiles = async(req, res, next) => {

    //handle after upload for property

    return res.status(201).json({ message: 'succefully upload property images' });

};



module.exports = {
    uploadSucceed,
    validPropertyId,
    validVehicleId,
    uploadedPropertyFiles,
    uploadedVehicleFiles
}