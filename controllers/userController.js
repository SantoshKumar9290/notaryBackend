const { returnResponseObj, emailValidation, mobileValidation, aadhaarValidation, decryptWithAES, generateToken, currentTime } = require('../utils');
const userModel = require('../model/userModel');
const renewalModel = require('../model/renewalModel');
const logger = require('../services/winston');

// POST Method
// route  /api/users/login
const login = async (req, res) => {
    try {
        const reqBody = req.body;
        const reqParams = req.params;
        logger.info(`reqBody :::::${reqBody}`);
        logger.info(`reqParams :::::${reqParams}`);
        reqBody.value = reqParams.type === 'aadhaar' ? decryptWithAES(reqBody.value, 1, false) : reqBody.value;
        const ob = loginValidation(reqParams, reqBody);
         logger.info(`loginValidation :::::${ob}`);
        if (ob.result) {
            const result = await userExists(reqParams, reqBody);
             logger.info(`result :::::${result}`);
            if (result) {
                let access_token = generateToken({id: result._id, name: result.name, email: result.email, aadhaar: result.aadhaar, mobile: result.mobile, loginType: 'USER', lastLoginTime: result.lastLoginTime});
                  logger.info(`access token :::::${access_token}`);
                await userModel.findByIdAndUpdate(result._id, {$set: {lastLoginTime:  currentTime(), token: access_token}})
                res.status(200).send({ message: 'User exists', token: access_token});
            } else {
                res.status(404).send({ message: "User Not Found" });
            }
        } else {
            logger.info(`message :::::${ob.msg}`);
            res.status(400).send({ message: ob.msg })
        }
    } catch (err) {
        logger.error("error ::",err)
        res.status(500).json({ ...returnResponseObj(500) })
    }
}

//POST method
// route /api/users/verifyUser/:type

const verifyUser = async (req, res) => {
    try {
        const reqBody = req.body;
        logger.info(`reqBody :::::${reqBody}`);
        const reqParams = req.params;
        logger.info(`reqParams :::::${reqParams}`);
        reqBody.value = reqParams.type === 'aadhaar' ? await decryptWithAES(reqBody.value, 0, false) : reqBody.value;
        const ob = loginValidation(reqParams, reqBody);
        logger.info(`loginValidation :::::${ob}`);
        if (ob.result) {
            const result = await userExists(reqParams, reqBody);
            logger.info(`result :::::${result}`);
            if (result) {
                res.status(200).send({ message: 'User exists' });
            } else {
                res.status(404).send({ message: "User Not Found" });
            }
        } else {
            logger.info(`message :::::${ob.msg}`);
            res.status(400).send({ message: ob.msg })
        }
    } catch (err) {
        logger.error("error",err)
        res.status(500).json({ ...returnResponseObj(500) })
    }
}

const regVerifyUser = async (req, res) => {
    const reqBody = req.body;
     logger.info(`reqBody :::::${reqBody}`);
    try {
        reqBody.aadhaar = decryptWithAES(reqBody.aadhaar, 0, false);
        const ob = validationCheck(reqBody);
         logger.info(`validationCheck :::::${ob}`);
        if (ob.result) {
            const result = await isUserExists(reqBody);
             logger.info(`result :::::${result}`);
            if (result === 'user not found') {
                res.status(200).send({ 'message': "User doesnot exist", status: true });
            } else if (result === 'user found') {
                res.status(400).send({ message: "User already exists", status: false });
            } else {
                res.status(500).json({ ...returnResponseObj(500) })
            }
        } else {
             logger.info(`message :::::${ob.msg}`);
            res.status(400).send({ message: ob.msg, status: false })
        }
    } catch (err) {
        logger.error("error ::",err)
        res.status(500).json({ ...returnResponseObj(500) })
    }
}

const userRegistration = async (req, res) => {
    const reqBody = req.body;
    logger.info(`reqBody :::::${reqBody}`);
    try {
        reqBody.aadhaar = decryptWithAES(reqBody.aadhaar, 1, false);
        const ob = validationCheck(reqBody, true);
        logger.info(`validationCheck :::::${ob}`);
        if (ob.result) {
            const result = await isUserExists(reqBody);
            logger.info(`result :::::${result}`);
            if (result === 'user not found') {
                let user = await userModel.create({...reqBody});
                res.status(200).send(user);
            } else if (result === 'user found') {
                res.status(400).send({ message: "User already exists", status: false });
            } else {
                res.status(500).json({ ...returnResponseObj(500) })
            }
        } else {
            logger.info(`message :::::${ob.msg}`);
            res.status(400).send({ message: ob.msg, status: false })
        }
    } catch (err) {
        logger.error("error ::",err)
        res.status(500).json({ ...returnResponseObj(500) })
    }
}

const getMe = async (req, res) => {
    try {
        let ob = {
            status: '',
        };

        const latestRenewal = await renewalModel.find({ status:{$in: ['DRAFT', 'PENDING']}, user: req.user._id }).sort({updatedAt: -1}).limit(1);
         logger.info(`latestRenewal :::::${latestRenewal}`);
        const latestAcceptedRenewal = await renewalModel.find({ status: 'ACCEPTED',  user: req.user._id } ).sort({updatedAt: -1}).limit(1);
        logger.info(`latestAcceptedRenewal :::::${latestAcceptedRenewal}`);
        if(latestAcceptedRenewal.length === 1){
            ob.LicenseValidFrom = latestAcceptedRenewal[0].newLicenseValidFrom;
            ob.LicenseValidFor = latestAcceptedRenewal[0].newLicenseValidFor;
            ob.status = latestAcceptedRenewal[0].status;
        }
        if(latestRenewal.length === 1){
            ob.status = latestRenewal[0].status;
            ob.applicationId = latestRenewal[0].applicationId;
        }

        res.status(200).json({'message': "User details fetched", "data" : {...ob}})

    } catch (err){
        logger.error("error ::",err)
        res.status(500).json({...returnResponseObj(500)});
    }
}

const isUserExists = async (body) => {
    try {
        const query = { "$or": [{ email: body.email }, { aadhaar: body.aadhaar }, { mobile: body.mobile }] };
        const user = await userModel.findOne(query);
        if (!user) {
            return 'user not found'
        } else {
            return 'user found'
        }
    } catch (err) {
        return 'error'
    }
}

const validationCheck = (body, nameFlag = false) => {
    let o = { result: true, msg: "" };
    if (!body.email && !body.mobile && !body.aadhaar) {
        o.result = false;
        o.msg = "Please fill the mandatory fields"
    } else if (!emailValidation(body.email)) {
        o.result = false;
        o.msg = "Please enter a valid email ID"
    } else if (!mobileValidation(body.mobile)) {
        o.result = false;
        o.msg = "Please enter a valid mobile number"
    } else if (!aadhaarValidation(body.aadhaar)) {
        o.result = false;
        o.msg = "Please enter a valid 12 digit aadhaar number"
    } else if (nameFlag && !(/^[A-Za-z ]+$/.test(body.name))) {
        o.result = false;
        o.msg = "Please enter a valid full name"
    }

    return o;
}

const loginValidation = (reqParams = {}, reqBody = {}) => {
    const o = { result: true, msg: "" };
    if (!reqBody.value || !['mobile', 'aadhaar', 'email'].includes(reqParams.type)) {
        o.result = false;
        o.msg = "Invalid Request"
    } else if (reqParams.type === 'email' && !emailValidation(reqBody.value)) {
        o.result = false;
        o.msg = "Invalid Email Address";
    } else if (reqParams.type === 'mobile' && !mobileValidation(reqBody.value)) {
        o.result = false;
        o.msg = "Invalid Mobile Number"
    } else if (reqParams.type === 'aadhaar' && !aadhaarValidation(reqBody.value)) {
        o.result = false;
        o.msg = "Invalid Aadhaar Number"
    }

    return o;
}

const userExists = async (reqParams, reqBody) => {
    try {
        let query = { [reqParams.type]: reqBody.value };
        const user = await userModel.findOne(query);
        if (!user) {
            return false;
        } else {
            return user;
        }
    } catch (err) {
        return false;
    }
}

const getRenewals = async (req, res) => {
    try {
        const user = req.user;
        logger.info(`user :::::${user}`);
        let users = await renewalModel.find({user:user._id}).sort({updatedAt:-1});
        res.status(200).json({data:users});
    } catch(err) {
        logger.error("error ::",err)
        res.status(500).json({ ...returnResponseObj(500) })
    }
}

module.exports = { login, verifyUser, regVerifyUser, userRegistration, getRenewals, getMe };
