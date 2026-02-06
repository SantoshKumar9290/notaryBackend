const { returnResponseObj, generateToken, decryptWithAES } = require("../utils");
const jwt = require('jsonwebtoken');
const userModel = require("../model/userModel");
const officerModel = require("../model/officerModel");
const logger = require("../services/winston");

const refreshToken = async (req, res) => {
    try{
        let tokenHeader = req.headers['authorization']
		  logger.info(`tokenHeader :::::${tokenHeader}`);
			if (tokenHeader) {
				let token = tokenHeader.split(" ");
	
				let decoded = jwt.decode(decryptWithAES(token[1], 1, true), process.env.JWT_SECRET);
				 logger.info(`decoded :::::${decoded}`);

				if (decoded && Object.keys(decoded).length && ['USER', 'OFFICER'].includes(decoded.loginType)) {
                    let currentTime = (new Date().getTime())/1000;
	
					let expiredVal = decoded.exp;
					const expiresIn = parseInt(process.env.JWT_REFRESH_EXPIRES_IN.replace("h",""));
					expiredVal = expiredVal+expiresIn*60*60;
					if(expiredVal < currentTime)
						return res.status(400).json({...returnResponseObj(400)});
					else
					{
						delete decoded.exp;
						delete decoded.iat;

						let access_token = generateToken(decoded);
						logger.info(`access token :::::${access_token}`);
						if(decoded.loginType === 'USER'){
							let user = await userModel.findById(decoded.id);
							logger.info(`user :::::${user}`);
							if(user){
								await userModel.findByIdAndUpdate(decoded.id, {$set: {token: access_token}});
							} else {
								res.status(404).send({
									'message': 'User Not Found'
								})
							}
						} else {
							let officer = await officerModel.findById(decoded.id);
							logger.info(`officer :::::${officer}`);
							if(officer){
								await officerModel.findByIdAndUpdate(decoded.id, {$set: {token: access_token}});
							} else {
								res.status(404).send({
									'message': 'Officer Not Found'
								})
							}
						}
						res.status(200).send(
						{	status:true,
							token: access_token
						}
						);
					}
                } else {
                    res.status(400).send({...returnResponseObj(400)})
                }
            }
            else {
                res.status(400).send({...returnResponseObj(400)})
            }
    } catch (err) {
		logger.error("error :::",err)
        console.log(err);
        res.status(500).send({...returnResponseObj(500)});
    }
}

module.exports = {refreshToken};