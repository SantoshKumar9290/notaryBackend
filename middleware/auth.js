const jwt = require('jsonwebtoken');
const officerModel = require('../model/officerModel');

const user = require('../model/userModel');
const { returnResponseObj, decryptWithAES } = require('../utils');
const logger = require('../services/winston');

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            // get token from header
            token = req.headers.authorization.split(' ')[1];

            if (token) {
                // verify token
                const decoded = jwt.verify(decryptWithAES(token, 1, true), process.env.JWT_SECRET);
                let currentTime = (new Date().getTime()) / 1000;
                // Get user from the token
                const notaryUser = await user.findById(decoded.id);
                if (notaryUser) {
                    req.user = notaryUser;
                    req.user.role = 'USER'
                } else {
                    const officer = await officerModel.findById(decoded.id);
                    req.user = officer;
                }

                //dont select password
                // .select('-password')
                if (req.user) {
                    if (req.user.token === token) {
                        if (decoded.exp < currentTime) {
                            res.status(401).json({ success: false, message: 'Token Validity Expired.' });
                        } else {
                            next();
                        }
                    } else {
                        res.status(401).send({ status: false, message: "Session Expired" })
                    }
                } else {
                    res.status(404).send({ status: false, message: "Invalid User" })
                }
            }
            else if (!token) {
                res.status(401).send({ status: false, message: "No token found" })
            }
        } else {
            res.status(401).send({ ...returnResponseObj(401) })
        }
    } catch (err) {
        logger.error("error ::",err)
        // console.log(err);
        res.status(401).send({ ...returnResponseObj(401) })
    }
}

const roleAccess = (roles) => {
    return (req, res, next) => {
        if (roles.includes(req.user.role)) {
            next();
        } else {
            res.status(403).json({ ...returnResponseObj(403) })
        }
    }
}

const validateThirdPartyAccess = function (req, res, next) {
    try {
        console.log("Inside of validateThirdPartyAccess :::: ");
        const authHeader = req.headers["authorization"];
        const APIKEY = req.headers["api-key"];
        console.log("authHeader :::: ", authHeader);
        console.log("APIKEY :::: ", APIKEY);
        if (authHeader != undefined && APIKEY != undefined) {
            try {
                let verified;
                let validAuthValue = 'Basic '+process.env.BASIC_AUTH_CODE;
                console.log("validAuthValue :::: ", validAuthValue);
                console.log("APIKEY :::: ", process.env.EC_API_KEY);
 
                if(authHeader == validAuthValue && APIKEY == process.env.EC_API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
            return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.error("error ::", e);
        return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
    }
}

module.exports = { protect, roleAccess,validateThirdPartyAccess }