const WL = require('../Data/WhiteList.js');

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

module.exports = {
    checkWhiteListAccessToken,
}