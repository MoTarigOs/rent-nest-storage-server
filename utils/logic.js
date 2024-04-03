const WL = require('../Data/WhiteList.js');
const path = require('path');
const allowedFilenameChar = 'ABCDEFGHIJKLMNOPQRSTUVWYZabcdefghijklmnopqrstuvwyz0123456789-_';

const maxVideoSize = 128000000;
const maxStorageSize = maxVideoSize + 10000000;
const maxImageSize = 1054000;

const checkWhiteListAccessToken = async (email, accessToken) => {
    try{

        if(!email || !accessToken)
            return false;

        const token = await WL.findOne({email});

        if(!token?.accessToken)  
            return false;

        if(token.accessToken !== accessToken)
            return false;

        return true;    
    } catch(err){
        return false;
    }
};

const arrayLimitSchema = (val) => {
    return val.length <= 30;
};

const isValidFilename = (filename) => {

    for (let i = 0; i < filename.length; i++) {
        if(!allowedFilenameChar.includes(filename[i])){
            //return false;
        }
    }

    return true;

};

const getValidFilename = (thisName) => {

    const ext = path.extname(thisName);

    let nameArr = thisName.replace(ext, "").split("").slice(0, 50);

    for (let i = 0; i < nameArr.length; i++) {
        if(!allowedFilenameChar.includes(nameArr[i])){
            nameArr[i] = '-';
        }
    }

    nameArr = nameArr.join("");

    return nameArr + ext;

};

const isValidText = (text, minLength) => {

    if(!minLength && (!text || typeof text !== "string" || text.length <= 0)) return false;

    if(minLength && (!text || typeof text !== "string" || text.length < minLength)) return false;

    // for (let i = 0; i < text.length; i++) {

    //     let passed = false;

    //     for (let j = 0; j < testChars.length; j++) {
    //         if(text[i] === testChars[j]) 
    //             passed = true;
    //     }

    //     if(!passed) return false;

    // };
    
    return true;
};

module.exports = {
    checkWhiteListAccessToken,
    arrayLimitSchema,
    isValidFilename,
    getValidFilename,
    isValidText,
    maxVideoSize,
    maxStorageSize,
    maxImageSize
}