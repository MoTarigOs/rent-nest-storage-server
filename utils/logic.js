const WL = require('../Data/WhiteList.js');
const path = require('path');
const ErrorModel = require('../Data/ErrorModel.js');
const allowedFilenameChar = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.';
const givenSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";
const maxVideoSize = 128000000;
const maxStorageSize = maxVideoSize + 10000000;
const maxImageSize = 1054000;
const isScan = false; // very dangerous! , must be true to scan viruses and bad files.

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

const getExtension = (file) => {

    if(file?.split('')?.reverse()?.join('')?.split('.')?.at(0)?.split('')?.reverse()?.join('') === 'png'
        || file?.split('')?.reverse()?.join('')?.split('.')?.at(0)?.split('')?.reverse()?.join('') === 'jpg') 
        return 'img';

    if(file?.split('')?.reverse()?.join('')?.split('.')?.at(0)?.split('')?.reverse()?.join('') === 'mp4'
        || file?.split('')?.reverse()?.join('')?.split('.')?.at(0)?.split('')?.reverse()?.join('') === 'avi') 
        return 'video';

    return null;    
        
};

const isValidFilename = (filename) => {

    if(!getExtension(filename)) return false;

    for (let i = 0; i < filename.length; i++) {
        if(!allowedFilenameChar.includes(filename[i])){
            return false;
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

const isOkayText = s => (!/[^\u0600-\u06FF\u0020-\u0040\u005B-\u0060\u007B-\u007E-\u0000-\u007F]/.test(s));

const isValidText = (text, minLength) => {

    if(!minLength && (!text || typeof text !== "string" || text.length <= 0)) return false;

    if(minLength && (!text || typeof text !== "string" || text.length < minLength)) return false;

    if(!isOkayText(text)) return false;

    const notAllowedTextChars = ['<', '>', '&','/','"',"'", '`'];

    for (let i = 0; i < notAllowedTextChars.length; i++) {
      if(text.includes(notAllowedTextChars[i])) return false;
    };
    
    return true;
};

const isValidEmail = (email) => {

    if(!email || typeof email !== "string" || email.length < 5 || email.length > 30) return false;

    const regexPattern = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{1,})$/;

    if(!regexPattern.test(email))
      return false;
  
    return true;

};

const reportDeleteFailureFile = async(filename, err, stack) => {

    // report an error occured while deleting a file

    const obj = {};

    if(isValidText(filename)) obj.filename = filename;

    obj.code = err.code;
    
    obj.stack = stack;

    try {
        await ErrorModel.create({ 
            isStorageError: true,
            storage_err: obj
        });
    } catch (err) {
        console.log(err);
    }
    
};

module.exports = {
    checkWhiteListAccessToken,
    arrayLimitSchema,
    isValidFilename,
    getValidFilename,
    isValidText,
    isValidEmail,
    reportDeleteFailureFile,
    maxVideoSize,
    maxStorageSize,
    maxImageSize,
    isScan
}