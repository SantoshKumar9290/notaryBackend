const { roleAccessConstants } = require("../constants");
const fileModel = require("../model/fileModel");
const masterDataModel = require("../model/masterDataModel");
const renewalModel = require("../model/renewalModel");
const { aadhaarValidation, minStrLengthValidation, nameValidation, emailValidation, addressValidation, dateValidation, commentValidation, returnResponseObj, decryptWithAES } = require("../utils");
const { getPaymentDataByAppId } = require("./paymentController");
const moment = require('moment');
const logger = require("../services/winston");

const submitApplication = async (req, res) => {
    try {
            const renApp = await renewalModel.findOne({user: req.user._id, status: "DRAFT"});
            logger.info(`renApp :::::${renApp}`);
            if(renApp){
                const paymentData = await getPaymentDataByAppId(renApp.applicationId);
                  logger.info(`paymentData :::::${paymentData}`);
                if(paymentData.length === 1 && paymentData[0].transactionStatus === 'Success'){
                    await renewalModel.updateOne({user: req.user._id, status: "DRAFT"}, {$set:{status:'PENDING', submissionDate: new Date().toISOString()}});
                    res.status(200).send({message: 'Application updated successfully', applicationId: renApp.applicationId, status: 'PENDING'});
                } else {
                    res.status(403).send({message: "Payment Pending for this application", status: false});
                }
            }
            else {
                res.status(404).send({ message: 'Application not found', status: false });
            }
    }
    catch(err) {
        logger.error("error :::",err)
        res.status(500).json({ ...returnResponseObj(500) });
    }
}

const saveDraft = async (req, res) => {
    const reqBody = req.body;
     logger.info(`reqBody :::::${reqBody}`);
    try{
        const obj = {};
        for(let i in reqBody){
            if(typeof reqBody[i] === 'string') {
                obj[i] = reqBody[i].trim();
            } else {
                obj[i] = reqBody[i];
            }
        }
        ['aadhaarNumber', 'mobile', 'name', 'dateOfBirth', 'email'].forEach(o => {
            let val = decryptWithAES(`${obj[o]}`, 0, ['aadhaarNumber', 'mobile'].includes(o) ? false : true);
            obj[o] = val;
        });
        const result = saveDraftValidation(obj);
        logger.info(`result :::::${result}`);
        if(result.success) {
            let latestRenewal;
            let application = await renewalModel.findOne({user: req.user._id, status: 'DRAFT'});
            obj.user = req.user._id;
            obj.status = 'DRAFT';
            ['certificateIssuedDate', 'certificateEndDate', 'dateOfBirth'].forEach(o => {
				if(obj[o]){
					obj[o] = new Date(`${obj[o]}T00:00:00Z`);
				}
			})
            if(!application){
                // donot allow user to riase application by checking previous data

                //getting sro code to attach it to application Id
                const master_data = await masterDataModel.findOne({districtName: obj.officeAddress.district, mandalName: obj.officeAddress.mandal, villageName: obj.officeAddress.village});
                 logger.info(`master data :::::${master_data}`);
                if(master_data){
                    obj['applicationId'] = 'NTY' + new Date().getFullYear() + master_data.districtCode.replace('_', '') + (new Date()/1);
                } else {
                    res.status(400).send({message: "Invalid Office Details", status: false})
                }
                // modify dates into smr format before storing

               latestRenewal = await renewalModel.create({...obj});
                 logger.info(`latestRenewal :::::${latestRenewal}`);
               res.status(200).send({message: 'Draft created successfully', 'applicationId': obj['applicationId']});
            } else {
                latestRenewal = await renewalModel.updateOne({user: req.user._id, status: 'DRAFT'}, {$set: {...obj}});
                logger.info(`latestRenewal :::::${latestRenewal}`);  
                res.status(200).send({message: 'Draft saved successfully'});
            }
        } else {
                logger.info(`message :::::${result.msg}`);  
            res.status(400).send({ message: result.msg, status: false })
        }
    } catch(err) {
        logger.info(`error :::::${err}`);
        console.log(err);
        res.status(500).json({ ...returnResponseObj(500) })
    }
}

const saveOldRenewal = async(req, res) => {
    const reqBody = req.body;
    logger.info(`reqBody :::::${reqBody}`);
    if(req.user.district !== req.body.officeAddress.district){
        return res.status(404).json({
            type:false,
            message:'Selected district and logged-in district do not match.'
        })
    }
    try {
        const obj = {};
        for(let i in reqBody){
            if(typeof reqBody[i] === 'string') {
                obj[i] = reqBody[i].trim();
            } else {
                obj[i] = reqBody[i];
            }
        }
        ['aadhaarNumber'].forEach(o => {
            if(obj[o]){
                let val = decryptWithAES(`${obj[o]}`, 0, false);
            obj[o] = val;
            }
        });
        const result = saveDraftValidation(obj);
        logger.info(`result :::::${result}`);
        if(result.success) {
            // obj.status = 'ACTIVE';
            obj.status = 'ACCEPTED';
            ['newLicenseValidFrom', 'newLicenseValidFor', 'dateOfBirth', 'submissionDate', 'actionDate'].forEach(o => {
				if(obj[o]){
					obj[o] = new Date(`${obj[o]}T00:00:00Z`);
				}
			});
            if(obj.type == 0){
                const master_data = await masterDataModel.findOne({districtName: obj.officeAddress.district, mandalName: obj.officeAddress.mandal, villageName: obj.officeAddress.village});
                if(master_data){
                    obj['applicationId'] = 'NTY_FRESH_ISSUE_' + new Date(`${obj['newLicenseValidFrom']}`).getFullYear() + master_data.districtCode.replace('_', '') + (new Date()/1);
                } else {
                    res.status(400).send({message: "Invalid Office Details", status: false})
                }
            }
                const latestRenewal = await renewalModel.create({...obj});
                res.status(200).send({message: 'Data Entry Successfull', 'applicationId': obj['applicationId']});
        } else {
                res.status(400).send({ message: result.msg, status: false })
        }
    } catch (err){
        logger.error("error :::",err)
        if(err.code && err.code === 11000 && err.message.includes('applicationId')){
            res.status(400).send({message: 'Application number is already present.', status: false});
        } else {
            res.status(500).json({...returnResponseObj(500)});
        }
        console.log(err)
    }
}

const findunUsualChars = (obj) => {
    console.log(":::::::::::::::::::::::::::::::::::::",obj)
    for(let i in obj){
        if(typeof obj[i] === 'string'){
            if(/[`%'"<>]/.test(obj[i])){
                return true
            }
        } else if(typeof obj[i] === 'object'){
            if(findunUsualChars(obj[i])){
                return true;
            }
        }
    }
    return false
}

const saveDraftValidation = (reqBody) => {
    const result = { success: true, msg: "" };
    
    if(findunUsualChars(reqBody)){
        return {success: false, msg: "Invalid Data Provided."}
    }
    else if(!reqBody.type || (reqBody.type < 0)) {
        result.success = false;
        result.msg = 'Invalid type value';
    } else if(!reqBody.enrollmentNumber || (reqBody.enrollmentNumber < 1)) {
        result.success = false;
        result.msg = 'Invalid enrollment number value';
    } else if(reqBody.certificateIssuedDate && !dateValidation(reqBody.certificateIssuedDate)) {
        result.success = false;
        result.msg = 'Invalid certificate issued date value';
    } else if(reqBody.certificateEndDate && !dateValidation(reqBody.certificateEndDate)) {
        result.success = false;
        result.msg = 'Invalid certificate end date value';
    } else if(reqBody.aadhaarNumber && (reqBody.aadhaarNumber && !aadhaarValidation(reqBody.aadhaarNumber))) {
        result.success = false;
        result.msg ='Invalid aadhaar value';
    } else if(!reqBody.name || (reqBody.name && !nameValidation(reqBody.name))) {
        result.success = false;
        result.msg ='Invalid name value';
    } else if(!reqBody.relationType || (reqBody.relationType && !['S/O', 'D/O', 'C/O','W/O'].includes(reqBody.relationType))) {
        result.success = false;
        result.msg ='Invalid relation type value';
    } else if(!reqBody.relationName || (reqBody.relationName && !minStrLengthValidation(reqBody.relationName))) {
        result.success = false;
        result.msg ='Invalid relation name value'; 
    } else if(!reqBody.dateOfBirth || (reqBody.dateOfBirth && !dateValidation(reqBody.dateOfBirth))) {
        result.success = false;
        result.msg ='Invalid date of birth value'; 
    } else if(reqBody.email && (reqBody.email && !emailValidation(reqBody.email))) {
        result.success = false;
        result.msg ='Invalid email value';
    } else if(!reqBody.officeAddress || (reqBody.officeAddress && !addressValidation(reqBody.officeAddress))) {
        result.success = false;
        result.msg ='Invalid office address value';
    } else if(!reqBody.homeAddress || (reqBody.homeAddress && !addressValidation(reqBody.homeAddress))) {
        result.success = false;
        result.msg ='Invalid home address value';
    } else if(reqBody.DR_Comment && !commentValidation(reqBody.DR_Comment)) {
        result.success = false;
        result.msg ='Invalid dr comment value';
    } else if(reqBody.DIG_Comment && !commentValidation(reqBody.DIG_Comment)) {
        result.success = false;
        result.msg ='Invalid dig comment value';
    } else if(reqBody.GOV_Comment && !commentValidation(reqBody.GOV_Comment)) {
        result.success = false;
        result.msg ='Invalid gov comment value';
    }
    return result;
}

const getApplicationById  = async(req, res) => {
    try {
        const appId = req.params.appId;
        logger.info(`appId :::::${appId}`);
        if(!appId){
            res.status(400).send({message: "Please provide application ID", status: false})
        } else {
            const application = await renewalModel.findOne({applicationId: appId, user: req.user._id});
            logger.info(`application :::::${application}`);
            if(application){
                const fileData = await fileModel.find({applicationId: appId, user: req.user._id}, {name: 1, fileType: 1});
                logger.info(`fileData :::::${fileData}`);
                res.status(200).send({'message': "Application fetched successfully", data: application, documents: fileData})
            } else {
                res.status(404).send({message: "Application not found", status: false});
            }
        }
    } catch (err) {
        logger.info(`error :::::${err}`);
        console.log(err)
        res.status(500).json({...returnResponseObj(500)});
    }
}

const getUserStatistics = async(req, res) => {
    try {
        let {district, mandal, village} = req.body;
        let matchQuery = {status: "ACCEPTED", newLicenseValidFor: {$gte: new Date()}, newLicenseValidFrom: {$lt: new Date()}};
        if(village){
            matchQuery = {...matchQuery, 'officeAddress.village': village};
        } if (mandal) {
            matchQuery = {...matchQuery, 'officeAddress.mandal': mandal};
        } if(district) {
            matchQuery = {...matchQuery, 'officeAddress.district': district};
        } else {
            if(req.user.role === roleAccessConstants.DR){
                matchQuery = {...matchQuery, 'officeAddress.district': req.user.district}
            } else if(req.user.role === roleAccessConstants.DIG){
                matchQuery = {...matchQuery, 'officeAddress.district': {$in: req.user.subDistrict}}
            }
        }
        logger.info(`matchQuery :::::${matchQuery}`);
        let groupVal = `$${village ? 'officeAddress.village' : mandal ? 'officeAddress.village' : district ? 'officeAddress.mandal' : 'officeAddress.district'}`;
        let total = await renewalModel.find(matchQuery).count();
        let result = await renewalModel.aggregate([{
            $match: matchQuery
        }, {
            $group: {
                '_id': {'name': groupVal, 'type': '$type'},
                'count': { '$sum': 1 }
            }
        }, {
            $group: {
                _id: "$_id.name",
                TYPE_GROUP: {
                    $push: {
                        type: "$_id.type",
                        count: "$count"
                    }
                },
                totalCount: {'$sum': '$count'}
            }
        }, {
            $sort: {totalCount: -1}
        }
        ]);
        res.status(200).send({result, total});
    } catch (err) {
        logger.error("error :::",err)
        console.log(err);
        res.status(500).json({...returnResponseObj(500)})
    }
} 

const getNotaryDataForRtgs = async (req, res) => {
    try {
        const { startdate, enddate } = req.query;

		if (!startdate || !enddate) {
			return res.status(400).json({
				message: !startdate ? "Start date is required" : "End date is required",
			});
		}

		const startDateMoment = moment(startdate, 'DD-MM-YYYY', true);
		const endDateMoment = moment(enddate, 'DD-MM-YYYY', true);
        logger.info(`Dates :::::${startDateMoment,endDateMoment}`);

		if (!startDateMoment.isValid() || !endDateMoment.isValid()) {
			return res.status(400).json({
				message: "Date format must be DD-MM-YYYY",
			});
		}

		if (endDateMoment.isBefore(startDateMoment)) {
			return res.status(400).json({
				message: "End date should be equal to or after Start date",
			});
		}

		const startDateObj = startDateMoment.toDate();
		const endDateObj = endDateMoment.endOf('day').toDate();

        const applications = await renewalModel.find({
            updatedAt: { $gte: startDateObj, $lte: endDateObj },
        });

        if (applications.length > 0) {
            const filteredData = applications.map(app => {
                const { _id, aadhaarNumber, ...rest } = app.toObject();
                return rest;
            });

            return res.status(200).send({
                message: "Applications fetched successfully",
                data: filteredData
            });
        } else {
            return res.status(404).send({ message: "No applications found in given date range", status: false });
        }
    } catch (err) {
        logger.error("error :::",err)
        console.log(err);
        return res.status(500).json({ message: "Internal Server Error", status: false });
    }
};

const GetNotaryStatisticsForRtgs = async (req, res) => {
	try {
		const { startdate, enddate } = req.query;

		if (!startdate || !enddate) {
			return res.status(400).json({
				message: !startdate ? "Start date is required" : "End date is required",
			});
		}

		const startDateMoment = moment(startdate, 'DD-MM-YYYY', true);
		const endDateMoment = moment(enddate, 'DD-MM-YYYY', true);
        logger.info(`dates :::::${startDateMoment,endDateMoment}`);

		if (!startDateMoment.isValid() || !endDateMoment.isValid()) {
			return res.status(400).json({
				message: "Date format must be DD-MM-YYYY",
			});
		}

		if (endDateMoment.isBefore(startDateMoment)) {
			return res.status(400).json({
				message: "End date should be equal to or after Start date",
			});
		}

		const startDateObj = startDateMoment.toDate();
		const endDateObj = endDateMoment.endOf('day').toDate();

		const query = {
			updatedAt: { $gte: startDateObj, $lte: endDateObj },
		};
        logger.info(`query :::::${query}`);

		const data = await renewalModel.aggregate([
            { $match: query },
            {
              $project: {
                district: "$officeAddress.district",
                mandal: "$officeAddress.mandal",
                village: "$officeAddress.village",
                status: 1,
                opening: {
                  $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0]
                },
                closed: {
                  $cond: [{ $in: ["$status", ["ACCEPTED", "REJECTED"]] }, 1, 0]
                }
              }
            },
            {
              $group: {
                _id: {
                  district: "$district",
                  mandal: "$mandal",
                  village: "$village"
                },
                openingCount: { $sum: "$opening" },
                closedCount: { $sum: "$closed" }
              }
            },
            {
              $addFields: {
                totalCount: { $add: ["$openingCount", "$closedCount"] }
              }
            },
            {
              $project: {
                _id: 0,
                district: "$_id.district",
                mandal: "$_id.mandal",
                village: "$_id.village",
                openingCount: 1,
                closedCount: 1,
                totalCount: 1
              }
            },
            {
              $sort: {
                district: 1,
                mandal: 1,
                village: 1
              }
            }
          ]);          

		res.status(200).json({
			message: "Data fetched successfully",
			data: data
		});
	} catch (err) {
        logger.error("error :::",err)
		console.error("Error fetching data:", err);
		res.status(500).json({
			message: "Internal Server Error",
			error: err.message
		});
	}
};

module.exports = {saveDraft, submitApplication, getApplicationById, saveOldRenewal, getUserStatistics, getNotaryDataForRtgs, GetNotaryStatisticsForRtgs};