const path = require('path');
const fs = require('fs').promises;
const Property = require('../Data/PropertyModel.js');
const VerCode = require('../Data/VerificationCode.js');
const mongoose = require('mongoose');
const { getFolderSize, getFolderSizeBin } = require('go-get-folder-size');
const { isValidFilename, isValidText, reportDeleteFailureFile } = require('../utils/logic.js');

const deletePropertyFilesAdmin = async(req, res) => {

    if(!req || !req.params) return res.status(403).json({ message: 'request error' });

    const { propertyId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(propertyId))
        return res.status(403).json({ message: 'request error' });

    let property = null;

    try {
        property = await Property.findOne({ _id: propertyId }).select('_id owner_id images videos');
        if(!property) return res.status(404).json({ message: 'not exist error' });
    } catch (err) {
        console.log(err.message);
        return res.status(501).json({ message: 'server error' });
    }

    for (let i = 0; i < property.images.length; i++) {
        try {
            await fs.unlink(path.join(__dirname, '..', 'uploads', property.images[i]));
        } catch(err) {
            if(err.code !== 'ENOENT'){
                await reportDeleteFailureFile(property[i].images[i], err, 'AdminController.js, function deletePropertyFilesAdmin, tried fs.unlink(image)');
            }
        }
    };

    for (let i = 0; i < property.videos.length; i++) {
        try {
            await fs.unlink(path.join(__dirname, '..', 'uploads', property.videos[i]));
        } catch (err) {
            if(err.code !== 'ENOENT'){
                await reportDeleteFailureFile(property[i].images[i], err, 'AdminController.js, function deletePropertyFilesAdmin, tried fs.unlink(video)');
            }
        }
    };

    try{

        if(property.images?.length > 0 || property.videos?.length > 0){
            await Property.updateOne({ _id: propertyId, owner_id: id }, {
                images: [], videos: []
            });
        };

    } catch (err) {
        console.log(err.message);
        return res.status(501).json({ message: 'server error' });
    }
    
    return res.status(201).json({ message: 'success' });

};

const deleteMultiplePropertiesFilesAdmin = async(req, res) => {

    if(!req || !req.query || !req.user || !req.params) return res.status(400).json({ message: "request error" });

    const { id, email } = req.user;
    const { userId } = req.params;
    const { eCode } = req.query;

    console.log(userId, eCode);

    if(!isValidText(eCode) || !mongoose.Types.ObjectId.isValid(id) 
    || !mongoose.Types.ObjectId.isValid(userId))
        return res.status(400).json({ message: 'request error' });

    try {

        const verCode = await VerCode.findOneAndUpdate({ 
            email: email, attempts: { $lte: 30 }
        }, { $inc: { attempts: 1 } });
    
        if(!verCode || !verCode.code || !verCode.date || verCode.attempts > 30) 
            return res.status(403).json({ message: "send code first" });

        if(verCode.code.toString() !== eCode) 
            return res.status(403).json({ message: "not allowed error" });
    
        if(Date.now() - verCode.date > (60 * 60 * 1000)) {
            await VerCode.updateOne({ email: email }, { code: null, date: null, attempts: 0 });
            return res.status(403).json({ message: "ver time end error" });
        }

    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: 'server error' });
    }

    let properties = null;
   
    try {
        properties = await Property.find({ owner_id: userId }).select('images videos');
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: 'server error' });
    }

    if(!properties) return res.status(201).json({ message: 'not exist error' });

    let propIds = [];
    for (let i = 0; i < properties.length; i++) {
        if(properties[i]?.images){
            for (let j = 0; j < properties[i].images.length; j++) {
                try {
                    await fs.unlink(path.join(__dirname, '..', 'uploads', properties[i].images[j]));
                } catch(err) {
                    if(err.code !== 'ENOENT'){
                        await reportDeleteFailureFile(properties[i].images[j], err, 'AdminController.js, function deleteMultiplePropertiesFilesAdmin, tried fs.unlink(image)');
                    }
                }
            }
        }
        if(properties[i]?.videos){
            for (let j = 0; j < properties[i].videos.length; j++) {
                try {
                    await fs.unlink(path.join(__dirname, '..', 'uploads', properties[i].videos[j]));
                } catch (err) {
                    if(err.code !== 'ENOENT'){
                        await reportDeleteFailureFile(properties[i].videos[j], err, 'AdminController.js, function deleteMultiplePropertiesFilesAdmin, tried fs.unlink(video)');
                    }
                }
            }
        }
        if(properties[i]?.images?.length > 0 || properties[i]?.videos?.length > 0)
            propIds.push(properties[i]._id);
    };

    try {
        await Property.updateMany({ _id: propIds }, {
            images: [], videos: []
        });
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: 'server error' });
    }

    return res.status(201).json({ message: 'success' });

};

const deletePropertySpecificFilesAdmin = async(req, res) => {

    if(!req || !req.params || !req.body) 
        return res.status(403).json({ message: 'request error' });

    const { propertyId } = req.params;

    const { filenamesArray } = req.body;

    if(!mongoose.Types.ObjectId.isValid(propertyId))
        return res.status(403).json({ message: 'request error' });

    if(!filenamesArray || filenamesArray.length <= 0) return res.status(403).json({ message: 'filename error' });

    for (let i = 0; i < filenamesArray.length; i++) {
        if(!isValidFilename(filenamesArray[i])){
            filenamesArray.splice(i, 1);
        }
    };

    if(filenamesArray.length <= 0) return res.status(403).json({ message: 'filename error' });
    
    let property;

    try {
        property = await Property.findOne({ _id: propertyId })
        .select('_id images videos');
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }

    if(!property) return res.status(403).json({ message: 'success error' });

    let deletedSize = 0;
    const imagesToPull = [];
    const videosToPull = [];
    for (let k = 0; k < filenamesArray.length; k++) {
        if(path.extname(filenamesArray[k]) === '.png' || path.extname(filenamesArray[k]) === '.jpg'){
            for (let i = 0; i < property.images.length; i++) {
                if(property.images[i] === filenamesArray[k]){
                    try {
                        deletedSize += (await fs.stat(path.join(__dirname, '..', 'uploads', property.images[i]))).size
                        await fs.unlink(path.join(__dirname, '..', 'uploads', property.images[i]));
                        imagesToPull.push(property.images[i]);
                    } catch (err) {
                        console.log(err);
                        if(err.code !== 'ENOENT'){
                            await reportDeleteFailureFile(property.images[i], err, 'AdminController.js, function deletePropertySpecificFilesAdmin, tried fs.stat(image)');
                        }
                    }
                }
            };
        } else if(path.extname(filenamesArray[k]) === '.mp4' || path.extname(filenamesArray[k]) === '.avi'){
            for (let i = 0; i < property.videos.length; i++) {
                if(property.videos[i] === filenamesArray[k]){
                    try {
                        deletedSize += (await fs.stat(path.join(__dirname, '..', 'uploads', property.videos[i]))).size
                        await fs.unlink(path.join(__dirname, '..', 'uploads', property.videos[i]));
                        videosToPull.push(property.videos[i]);
                    } catch (err) {
                        console.log(err);
                        if(err.code !== 'ENOENT'){
                            await reportDeleteFailureFile(property.videos[i], err, 'AdminController.js, function deletePropertySpecificFilesAdmin, tried fs.stat(video)');
                        }
                    }
                }
            };
        }
    }
    
    if(deletedSize <= 0 || (imagesToPull.length <= 0 && videosToPull.length <= 0)) 
        return res.status(400).json({ message: 'request error' });

    try {

        const newProp = await Property.findOneAndUpdate({ _id: propertyId }, {
            $pull: { 
                images: { $in: imagesToPull },
                videos: { $in: videosToPull }
            },
            $inc: {
                'files_details.total_size': -deletedSize,
                'files_details.no': -(imagesToPull.length + videosToPull.length)
            }
        }, { new: true });
    
        if(!newProp) return res.status(500).json({ message: 'server error' });
    
        return res.status(201).json(newProp);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }        

};

const deleteFileAdmin = async(req, res) => {

    try {

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { filename } = req.params;

        console.log(filename);

        if(!isValidFilename(filename)) return res.status(400).json({ message: 'name error' });

        await fs.unlink(path.join(__dirname, '..', 'uploads', filename));

        return res.status(201).json({ message: 'success' });
        
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: err.message });
    }

};

const getFolderSizeAdmin = async(req, res) => {

    try {

        const size = await getFolderSizeBin(path.join(__dirname, '..', 'uploads'));

        console.log('storage size: ', size);

        return res.status(200).json({ size });
        
    } catch (err) {
        console.log(err.message);
        return res.status(501).json('get folder size error');
    }
};

const getAllFilenamesAdmin = async(req, res) => {


    try {

        console.log('files reached');

        const files = await fs.readdir('./uploads');

        return res.status(200).json(files);
        
    } catch (err) {
        console.log(err.message);
        return res.status(501).json({ message: 'server error' });
    }
};

module.exports = {
    deletePropertyFilesAdmin,
    deleteMultiplePropertiesFilesAdmin,
    deletePropertySpecificFilesAdmin,
    deleteFileAdmin,
    getFolderSizeAdmin,
    getAllFilenamesAdmin
}