const jwt = require('jsonwebtoken');
const { checkWhiteListAccessToken } = require('../utils/logic');

const verifyJWT = async(req, res, next) => {

    try {

        console.log('verifing jwt');

        if(!req?.cookies || !req?.cookies?._r_t)
            return res.status(401).json({ message: "Login" });

        if(!req.cookies?._a_t)
            return res.status(401).json({ message: "jwt expired" });

        const token = req.cookies._a_t;

        jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
            async (err, decoded) => {

                if(err) return res.status(401).json({ message: "jwt expired" }); //forbidden due to invalid token

                req.user = decoded.user;

                req.token_exp = decoded.exp - decoded.iat;

                const userEmail = req.user.email;
                const allowed = await checkWhiteListAccessToken(userEmail, token);

                if(!allowed || allowed === false)
                    return res.status(401).json({ message: "jwt expired" });

                next();

            }
        );

    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'unknown error' });
    }
};

module.exports = verifyJWT;