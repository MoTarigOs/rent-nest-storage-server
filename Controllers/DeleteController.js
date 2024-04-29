const path = require('path');
const fs = require('fs').promises;
const Property = require('../Data/PropertyModel.js');
const mongoose = require('mongoose');
const { isValidFilename, reportDeleteFailureFile } = require('../utils/logic.js');

const deletePropertyFiles = async(req, res) => {

    if(!req || !req.user || !req.params) return res.status(403).json({ message: 'request error' });

    const { id } = req.user;

    const { propertyId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
        return res.status(403).json({ message: 'request error' });

    let property; 
    
    try {
        property = await Property.findOne({ _id: propertyId, owner_id: id }).select('_id owner_id images videos');
    } catch(err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }

    if(!property) return res.status(403).json({ message: 'success error' });

    for (let i = 0; i < property.images.length; i++) {
        try {
            await fs.unlink(path.join(__dirname, '..', 'uploads', property.images[i]));
        } catch (err) {
            console.log(err);
            if(err.code !== 'ENOENT'){
                await reportDeleteFailureFile(property.images[i], err, 'DeleteController.js, function deletePropertyFiles, tried fs.unlink(image)');
            }
        }
    };

    for (let i = 0; i < property.videos.length; i++) {
        try {
            await fs.unlink(path.join(__dirname, '..', 'uploads', property.videos[i]));
        } catch (err) {
            console.log(err);
            if(err.code !== 'ENOENT'){
                await reportDeleteFailureFile(property.videos[i], err, 'DeleteController.js, function deletePropertyFiles, tried fs.unlink(video)');
            }
        }
    };

    if(property.images?.length > 0 || property.videos?.length > 0){
        try {
            await Property.updateOne({ _id: propertyId, owner_id: id }, {
                images: [], videos: []
            });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: 'server error' });
        }
    };

    return res.status(201).json({ message: 'success' });

};

const deletePropertySpecificFile = async(req, res) => {

    if(!req || !req.user || !req.params || !req.query) return res.status(403).json({ message: 'request error' });

    const { id } = req.user;

    const { propertyId } = req.params;

    const { filename } = req.query;

    if(!mongoose.Types.ObjectId.isValid(id) 
        || !mongoose.Types.ObjectId.isValid(propertyId)
        || !isValidFilename(filename))
        return res.status(403).json({ message: 'request error' });

    let property;
    
    
    try {
        
        property = await Property.findOne({ _id: propertyId, owner_id: id })
        .select('_id owner_id images videos');

    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: err.message });
    }
   
    if(!property) return res.status(403).json({ message: 'success error' });

    let pullObj = {};
    let deletedSize = 0;
    if(path.extname(filename) === '.png' || path.extname(filename) === '.jpg'){
        for (let i = 0; i < property.images.length; i++) {
            if(property.images[i].filename === filename){
                try {
                    deletedSize += await fs.stat(path.join(__dirname, '..', 'uploads', property.images[i].filename))
                    await fs.unlink(path.join(__dirname, '..', 'uploads', property.images[i].filename));
                    pullObj = { images: { filename } };
                } catch (err) {
                    console.log(err);
                    if(err.code === 'ENOENT') {
                        pullObj = { images: { filename } };
                    } else {
                        return res.status(500).json({ message: 'server error' });
                    }
                }
            }
        };
    } else if(path.extname(filename) === '.mp4' || path.extname(filename) === '.avi'){
        for (let i = 0; i < property.videos.length; i++) {
            if(property.videos[i].filename === filename){
                try {
                    deletedSize += await fs.stat(path.join(__dirname, '..', 'uploads', property.videos[i].filename))
                    await fs.unlink(path.join(__dirname, '..', 'uploads', property.videos[i].filename));
                    pullObj = { videos: { filename } };
                } catch (err) {
                    console.log(err);
                    if(err.code === 'ENOENT') {
                        pullObj = { videos: { filename } };
                    } else {
                        return res.status(500).json({ message: 'server error' });
                    }
                }
                
            }
        };
    } else {
        return res.status(400).json({ message: 'request error' });
    }

    if(deletedSize <= 0 || pullObj === {}) return res.status(400).json({ message: 'request error' });

    try {
        await Property.updateOne({ _id: propertyId, owner_id: id }, {
            $pull: pullObj,
            files_details: { 
                $inc: { total_size: -deletedSize }, 
                $inc: { no: -1 } 
            }
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }

    return res.status(201).json({ message: 'success' });

};

const deletePropertySpecificFiles = async(req, res) => {

    if(!req || !req.user || !req.params || !req.body) return res.status(403).json({ message: 'request error' });

    const { id } = req.user;

    const { propertyId } = req.params;

    const { filenamesArray } = req.body;

    if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
        return res.status(403).json({ message: 'request error' });

    if(!filenamesArray || filenamesArray.length <= 0 || !Array.isArray(filenamesArray)) return res.status(403).json({ message: 'filename error' });

    for (let i = 0; i < filenamesArray.length; i++) {
        if(!isValidFilename(filenamesArray[i])){
            filenamesArray.splice(i, 1);
        }
    };

    if(filenamesArray.length <= 0) return res.status(403).json({ message: 'filename error' });
    
    let property;

    try {

        property = await Property.findOne({ _id: propertyId, owner_id: id })
        .select('_id owner_id images videos');

    } catch (err) {
        console.log(err.message);
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
                        if(err.code === 'ENOENT') {
                            imagesToPull.push(property.images[i]);
                        } else {
                            await reportDeleteFailureFile(property.images[i], err, 'DeleteController.js, function deletePropertySpecificFiles, tried fs.unlink(image)');
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
                        if(err.code === 'ENOENT') {
                            videosToPull.push(property.videos[i]);
                        } else {
                            await reportDeleteFailureFile(property.videos[i], err, 'DeleteController.js, function deletePropertySpecificFiles, tried fs.unlink(videos)');
                        }
                    }
                }
            };
        }
    }

    if(imagesToPull.length <= 0 && videosToPull.length <= 0) 
        return res.status(400).json({ message: 'request error' });

    try {

        const newProp = await Property.findOneAndUpdate({ _id: propertyId, owner_id: id }, {
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
        console.log(err.message);
        return res.status(500).json({ message: 'server error' });
    }

};

const deleteMultiplePropertiesFiles = async(req, res) => {

    if(!req || !req.user) return res.status(400).json({ message: "request error" });

    const { id } = req.user;

    if(!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ message: 'request error' });

    let properties;

    try {
        properties = await Property.find({ owner_id: id }).select('_id images videos').limit(2000);
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: 'server error' });
    }

    let propIds = [];
    for (let i = 0; i < properties.length; i++) {
        if(properties[i].images){
            for (let j = 0; j < properties[i].images.length; j++) {
                try {
                    await fs.unlink(path.join(__dirname, '..', 'uploads', properties[i].images[j]));
                } catch (err) {
                    console.log(err);
                    if(err.code !== 'ENOENT'){
                        await reportDeleteFailureFile(properties[i].images[j], err, 'DeleteController.js, function deleteMultiplePropertiesFiles, tried fs.unlink(image)');
                    }
                }
            }
        }
        if(properties[i].videos){
            for (let j = 0; j < properties[i].videos.length; j++) {
                try {
                    await fs.unlink(path.join(__dirname, '..', 'uploads', properties[i].videos[j]));
                } catch (err) {
                    console.log(err);
                    if(err.code !== 'ENOENT'){
                        await reportDeleteFailureFile(properties[i].images[j], err, 'DeleteController.js, function deleteMultiplePropertiesFiles, tried fs.unlink(video)');
                    }
                }
            }
        }
        if(properties[i].images?.length > 0 || properties.videos?.length > 0)
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

module.exports = {
    deletePropertyFiles,
    deletePropertySpecificFile,
    deletePropertySpecificFiles,
    deleteMultiplePropertiesFiles
}