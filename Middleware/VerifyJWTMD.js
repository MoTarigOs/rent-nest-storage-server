const VerCode = require('../Data/VerificationCode.js');
const { isValidEmail } = require('../utils/logic.js');

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

        next();

    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: 'server error' });
    }

};

module.exports = verifyJWT;