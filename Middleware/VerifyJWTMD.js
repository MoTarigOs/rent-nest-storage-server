const VerCode = require('../Data/VerificationCode.js');
const User = require('../Data/UserModel.js');
const { isValidEmail } = require('../utils/logic.js');
const { default: mongoose } = require('mongoose');

const verifyJWT = async(req, res, next) => {

    const key = req?.headers?.authorization?.split(' ')?.at(1);

    const email = req?.query?.email;

    if(!key || key === 'Bearer' || key.length < 10 || !isValidEmail(email))
        return res.status(401).json({ message: 'request error' });

    try {

        const verCode = await VerCode.findOneAndUpdate({ storage_key: key, email, storage_key_attempts: { $lte: 500 } }, {
            $inc: { storage_key_attempts: 1 }
        });

        if(!verCode || !verCode.storage_key_date) return res.status(403).json({ message: 'not exist error' });
        
        if((Date.now() - verCode.storage_key_date) > (8 * 60 * 60 * 1000))
            return res.status(403).json({ message: 'time out error' });

        const id = key.split('-')?.at(1);
    
        if(!mongoose.Types.ObjectId.isValid(id))
            return res.status(401).json({ message: 'request error' });

        const user = await User.findOne({ _id: id, email })
            .select('_id username');
        
        if(!user) return res.status(403).json({ message: 'not allowed error' });

        req.user = {
            id, email, username: user.username
        };

        next();

    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: 'server error' });
    }

};

module.exports = verifyJWT;