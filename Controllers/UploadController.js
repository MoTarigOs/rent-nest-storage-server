const mongoose = require("mongoose");
const Property = require('../Data/PropertyModel.js');
const { maxStorageSize } = require("../utils/logic.js");

const validPropertyId = async(req, res, next) => {

    try {

         //check if the property exist and the owner is the requester

        console.log('checking for valid property id: ', req.params.propertyId);

        if(!req || !req.user || !req.params) return res.status(403).json({ message: 'request error' });

        const { id } = req.user;

        const { propertyId } = req.params;

        const { isEdit } = req.body ? req.body : { isEdit: null };

        if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(403).json({ message: 'request error' });

        const property = await Property.findOne({ _id: propertyId, owner_id: id }).select('_id owner_id videos images');

        console.log('property: ', property);

        if(!property || property.images.length > 0 || property.videos.length > 0) 
            return res.status(403).json({ message: 'access error' });

        next();
            
    } catch (err) {
        console.log(err.message);
        return res.status(501).json({ message: 'server error' });
    }

};

const validPropertyIdForAdd = async(req, res, next) => {

    try {

         //check if the property exist and the owner is the requester

        console.log('checking for valid property id: ', req.params.propertyId);

        if(!req || !req.user || !req.params) return res.status(403).json({ message: 'request error' });

        const { id } = req.user;

        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(403).json({ message: 'request error' });

        const property = await Property.findOne({ _id: propertyId, owner_id: id }).select('_id owner_id videos images files_details');

        console.log('property: ', property);

        if(!property) return res.status(403).json({ message: 'access error' });

        if(property.files_details 
            && (property.files_details.total_size > maxStorageSize
            || property.files_details.no >= 50)){
                return res.status(403).json({ message: 'storage limit error' });
            };

        next();
            
    } catch (err) {
        console.log(err.message);
        return res.status(501).json({ message: 'server error' });
    }

};

const uploadedPropertyFiles = async(req, res, next) => {

    //handle after upload for property
    
    if(!req || !req.user || !req.files) return res.status(400).json({ message: 'request error' });

    const files = req.files;

    const { id } = req.user;

    console.log('files: ', files);

    if(!files || files.length <= 0) return res.status(501).json({ message: 'unknown error' });

    const { propertyId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(propertyId) || !mongoose.Types.ObjectId.isValid(id)) 
        return res.status(400).json({ message: 'request error' });

    let imagesNames = [];
    let videosNames = [];
    for (let i = 0; i < files.length; i++) {

        if(files[i] && (files[i].mimetype === 'video/mp4' || files[i].mimetype === 'video/avi')) 
            videosNames.push(files[i].filename);

        if(files[i] && (files[i].mimetype === 'image/png' || files[i].mimetype === 'image/jpeg')) 
            imagesNames.push(files[i].filename);

    };

    if(imagesNames.length <= 0 && videosNames.length <= 0) return res.status(501).json({ message: 'unknown error' });

    const property = await Property.updateOne({ _id: propertyId, owner_id: id }, { 
        images: imagesNames, 
        videos: videosNames, 
        files_details: { 
            total_size: req.uploadedFilesTotalSize, 
            no: imagesNames.length + videosNames.length 
        }
    });

    console.log('updateOne function return: ', property);

    if(!property || property.modifiedCount < 1 || property.acknowledged === false) 
        return res.status(501).json({ message: 'unknown error' });

    return res.status(201).json({ message: 'succefully upload property images' });

};

const addPropertyFiles = async(req, res, next) => {

    if(!req || !req.user || !req.files) return res.status(400).json({ message: 'request error' });

    const files = req.files;

    const { id } = req.user;

    console.log('files: ', files);

    if(!files || files.length <= 0) return res.status(501).json({ message: 'unknown error' });

    const { propertyId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(propertyId) || !mongoose.Types.ObjectId.isValid(id)) 
        return res.status(400).json({ message: 'request error' });

    let imagesNames = [];
    let videosNames = [];
    for (let i = 0; i < files.length; i++) {

        if(files[i] && (files[i].mimetype === 'video/mp4' || files[i].mimetype === 'video/avi')) 
            videosNames.push(files[i].filename);

        if(files[i] && (files[i].mimetype === 'image/png' || files[i].mimetype === 'image/jpeg')) 
            imagesNames.push(files[i].filename);

    };

    if(imagesNames.length <= 0 && videosNames.length <= 0) return res.status(501).json({ message: 'unknown error' });

    let pushObj = {};
    if(imagesNames.length > 0 && videosNames.length > 0){
        pushObj = { 
            $push: { 
                images: { $each: imagesNames },
                videos: { $each: videosNames }
            }, 
            $inc: {
                'files_details.total_size': req.uploadedFilesTotalSize,
                'files_details.no': imagesNames.length + videosNames.length
            }
            // files_details: { 
            //     $inc: { total_size: req.uploadedFilesTotalSize }, 
            //     $inc: { no: imagesNames.length + videosNames.length } 
            // }
        }
    } else if(imagesNames.length > 0 && videosNames.length <= 0){
        pushObj = { 
            $push: { 
                images: { $each: imagesNames }
            }, 
            $inc: {
                'files_details.total_size': req.uploadedFilesTotalSize,
                'files_details.no': imagesNames.length
            }
        }
    } else if(videosNames.length > 0 && imagesNames.length <= 0){
        pushObj = { 
            $push: { 
                videos: { $each: videosNames }
            }, 
            $inc: {
                'files_details.total_size': req.uploadedFilesTotalSize,
                'files_details.no': videosNames.length
            }
        }
    };

    const property = await Property.findOneAndUpdate(
        { _id: propertyId, owner_id: req.user.id }, 
        { ...pushObj, checked: false },
        { new: true }
    );

    console.log('updateOne function return: ', property);

    if(!property) return res.status(501).json({ message: 'unknown error' });

    return res.status(201).json(property);

};

module.exports = {
    validPropertyId,
    validPropertyIdForAdd,
    uploadedPropertyFiles,
    addPropertyFiles
}