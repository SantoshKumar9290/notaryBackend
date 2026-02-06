const bcrypt = require("bcryptjs");
const {
  emailValidation,
  returnResponseObj,
  generateToken,
  currentTime,
  maskString,
  decryptWithAES,
} = require("../utils");
const officer = require("../model/officerModel");
const {
  updateOfficerType,
  passwordRegex,
  nameRegex,
  roleAccessConstants,
  comments,
  commentTypes,
} = require("../constants");
const userModel = require("../model/userModel");
const renewalModel = require("../model/renewalModel");
const masterDataModel = require("../model/masterDataModel");
const fileModel = require("../model/fileModel");
const loghistoryofNotary = require("../model/loghistoryModel");
const logger = require("../services/winston");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !emailValidation(email)) {
      res.status(400).send({ message: "Invalid Request", status: false });
    } else {
      const user = await officer.findOne({ loginEmail: email });
      logger.info(`user :::::${user}`);
      if (!user) {
        res.status(404).send({ message: "Officer not found", status: false });
      } else if(user.loginBlockedUntil && new Date(user.loginBlockedUntil) > new Date()){
        res.status(400).send({message: `Login Blocked Until ${new Date(user.loginBlockedUntil)}`});
      }
      else if (await bcrypt.compare(password, user.loginPassword)) {
        let access_token = generateToken({
          id: user._id,
          name: user.loginName,
          role: user.role,
          designation: user.designation,
          district: user.district,
          subDistrict: user.subDistrict ? user.subDistrict : [],
          email: user.loginEmail,
          loginType: "OFFICER",
          lastLoginTime: user.lastLoginTime
        });
        logger.info(`generateToken :::::${access_token}`);
        await officer.findByIdAndUpdate(user._id, {$set: {lastLoginTime: currentTime(), token: access_token, loginAttempts: 5, loginBlockedUntil: null}});

        res.status(200).send({
          message: "Officer login successfull",
          token: access_token,
          isPasswordUpdated: user.isPasswordUpdated
        });
      } else {
        let loginAttempts = user.loginAttempts !== 0 ? user.loginAttempts - 1 : 4;
        let query = {loginAttempts, loginBlockedUntil: null};
        if(loginAttempts === 0){
          let twentyMinutesLater = new Date();
          twentyMinutesLater.setMinutes(twentyMinutesLater.getMinutes() + 20)
          query = {...query, loginBlockedUntil: twentyMinutesLater}
        }
        await officer.findByIdAndUpdate(user._id, {$set: {...query}});
        res.status(400).send({ message: `Invalid Email ID/ Password. Login Attempts left: ${loginAttempts}` });
      }
    }
  } catch (err) {
    logger.error("error ::",err)
    console.log(err);
    res.status(500).send({ ...returnResponseObj(500) });
  }
};

const acceptApplication = async (req, res) => {
  try {
    const appId = req.params.appId;
     logger.info(`appId :::::${appId}`);
    let { comments, status } = req.body;
    comments = typeof comments === "string" ? comments.trim() : comments;
     logger.info(`comments :::::${comments}`);
    if (!appId || (status && !["ACCEPTED", "REJECTED"].includes(status))) {
      res.status(400).json({ ...returnResponseObj(400) });
    } else if (!comments || comments.length < 30) {
      res.status(400).json({
          message: "Please provide a comment with minimum 30 characters",
        });
    } else {
      const renewalApp = await renewalModel.findOne({
        applicationId: appId,
        status: "PENDING",
      });
       logger.info(`renewalApp :::::${renewalApp}`);
      if (renewalApp) {
        let setQuery = {};
        if (req.user.role === roleAccessConstants.DR) {
          if (
            renewalApp.officeAddress.district === req.user.district &&
            !renewalApp.DR_Comment
          ) {
            setQuery = { DR_Comment: comments };
          } else {
            res.status(403).json({ ...returnResponseObj(403) });
          }
        } else if (req.user.role === roleAccessConstants.DIG) {
          if (
            req.user.subDistrict.includes(renewalApp.officeAddress.district) &&
            renewalApp.DR_Comment
          ) {
            if (renewalApp.type === 1) {
              setQuery = { status: status, DIG_Comment: comments };
            } else if (!renewalApp.DIG_Comment) {
              setQuery = { DIG_Comment: comments };
            } else {
              res.status(403).json({ ...returnResponseObj(403) });
            }
          } else {
            res.status(403).json({ ...returnResponseObj(403) });
          }
        } else if (req.user.role === roleAccessConstants.IG) {
          if (
            renewalApp.type === 1 ||
            !renewalApp.DR_Comment ||
            !renewalApp.DIG_Comment ||
            renewalApp.IG_Comment
          ) {
            res.status(403).json({ ...returnResponseObj(403) });
          } else if (renewalApp.type === 2) {
            setQuery = { status: status, IG_Comment: comments };
          } else {
            setQuery = { IG_Comment: comments };
          }
        } else if (req.user.role === roleAccessConstants.GOV) {
          if (
            renewalApp.type < 3 ||
            !renewalApp.DR_Comment ||
            !renewalApp.DIG_Comment ||
            !renewalApp.IG_Comment ||
            renewalApp.GOV_Comment
          ) {
            res.status(403).json({ ...returnResponseObj(403) });
          } else if (renewalApp.type > 2) {
            setQuery = { status: status, GOV_Comment: comments };
          }
        }
        if (setQuery.status) {
          setQuery["actionDate"] = new Date().toISOString();
        }
        await renewalModel.updateOne(
          { applicationId: appId },
          { $set: { ...setQuery } }
        );
        res.status(200).json({ message: "Application Accepted Successfully" });
      } else {
        res.status(404).json({ message: "Application not found", status: false });
      }
    }
  } catch (err) {
    logger.error("error ::",err);
    res.status(500).json({ ...returnResponseObj(500) });
  }
};

const updateOfficerDetails = async (req, res) => {
  //type - name, password
  const reqBody = req.body;
  const user = req.user;
  logger.info(`reqBody :::::${reqBody}`);
  logger.info(`user :::::${user}`);
  try {
    if (
      reqBody.type === updateOfficerType.Password &&
      user._id &&
      user.loginPassword &&
      reqBody.oldPassword &&
      reqBody.password
    ) {
      if (reqBody.oldPassword === reqBody.password) {
        res
          .status(400)
          .send({ message: "New password matched with old password" });
      } else if (
        !(await bcrypt.compare(reqBody.oldPassword, user.loginPassword))
      ) {
        res.status(400).send({ message: "Invalid old password" });
      } else if (!passwordRegex.test(reqBody.password)) {
        res
          .status(400)
          .send({ message: "Password didn't meet the required criteria" });
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(reqBody.password, salt);
        await officer.findByIdAndUpdate(user._id, {
          $set: { loginPassword: hashedPassword, isPasswordUpdated: true },
        });
        res.status(200).send({ message: "Password updated successfully" });
      }
    } else if (
      reqBody.type === updateOfficerType.LoginName &&
      user._id &&
      reqBody.loginName
    ) {
      if (!nameRegex.test(reqBody.loginName)) {
        res.status(400).send({ message: "Invalid login name" });
      } else {
        await officer.findByIdAndUpdate(user._id, {
          $set: { loginName: reqBody.loginName },
        });
        res.status(200).send({ message: "Officer Name Updated Successfully" });
      }
    } else {
      res.status(400).send({ ...returnResponseObj(400) });
    }
  } catch (err) {
    logger.error("error ::",err);
    console.log(err);
    res.status(500).send({ ...returnResponseObj(500) });
  }
};

const getRenewals = async (req, res) => {
  
  try {
    const { page, limit, district, status } = req.body;
    const user = req.user;
    console.log("::::::::useruseruseruser::::::::;",user)
    logger.info(`user :::::${user}`);
    if(typeof page !== "number" || typeof limit !== 'number' || typeof district !== 'string' || typeof status !== 'string'){
      res.status(400).send({message: "Invalid Request"});
    } else {
    let comment = comments.filter(c => c.role === user.role)[0].value;
    logger.info(`comment :::::${comment}`);
    let dbFilterQuery = status === 'FORWARDED' ? {status: 'PENDING', [comment]: {$exists: true, $ne: ""}} :{status: status ? status : {$in: ['PENDING', 'REJECTED', 'ED']}};
    if (user.role && page > 0 && limit > 0) {
      if (user.role === roleAccessConstants.DR) {
        if (user.district) {
          dbFilterQuery = {
            ...dbFilterQuery,
            'officeAddress.district': user.district,
          };
        } else {
          res
            .status(400)
            .send({ message: "Invalid district value identified for DR role" });
        }
      } else if (user.role === roleAccessConstants.DIG) {
        if (user.subDistrict && user.subDistrict.length > 0) {
          dbFilterQuery = {
            ...dbFilterQuery,
            'officeAddress.district': district ? district : { $in: user.subDistrict },
          };
        } else {
          res
            .status(400)
            .send({
              message: "Invalid sub district value identified for DIG role",
            });
        }
      } else {
        if(district){
          dbFilterQuery = {
            ...dbFilterQuery,
            'officeAddress.district': district
          };
        }
      }
      const recordsCount = await renewalModel.count(dbFilterQuery);
      const records = await renewalModel
        .find(dbFilterQuery, {aadhaarNumber: 0, mobile: 0})
        .sort({createdAt: -1})
        .skip((page - 1) * limit)
        .limit(limit);
      
      res
        .status(200)
        .json({ data: records, totalCount: recordsCount, page: page });
    } else {
      res.status(400).send({ ...returnResponseObj(400) });
    }
  }
  } catch (err) {
    logger.error("error ::",err);
    console.log(err);
    res.status(500).send({ ...returnResponseObj(500) });
  }
};

const getStatistics = async (req, res) => {
  const user = req.user;
   logger.info(`user :::::${user}`);
  try {
    let dbFilterQuery = {status: {$in: ['PENDING', 'ACCEPTED', 'REJECTED']}};
     logger.info(`dbFilterQuery :::::${dbFilterQuery}`);
    let districts = [];
    if(user.role === roleAccessConstants.DR){
      districts = [`${user.district}`];
      dbFilterQuery = {...dbFilterQuery, "officeAddress.district": user.district }
    }
    else if (user.role === roleAccessConstants.DIG) {
      if (user.subDistrict && user.subDistrict.length > 0) {
        districts = user.subDistrict;
        dbFilterQuery = {...dbFilterQuery, "officeAddress.district": { $in: user.subDistrict } };
      } else {
        res
          .status(400)
          .send({
            message: "Invalid sub district value identified for DIG role",
          });
      }
    } else {
      //for ig or gov roles
      districts = await masterDataModel.distinct("districtName");
       logger.info(`districts :::::${districts}`);
      dbFilterQuery = {...dbFilterQuery, "officeAddress.district": { $in: districts } };
    }

    const commentName = comments.filter(c => c.role === req.user.role)[0].value;
     logger.info(`commentName :::::${commentName}`);

    let result = await renewalModel.aggregate([{
      $match: dbFilterQuery
    }, {
      $group: {
        '_id': {'name': '$officeAddress.district'},
        'PENDING': {
          '$sum': {
            '$cond': [ { $eq: [ "$status", "PENDING" ] }, 1, 0 ]
          }
        },
        'ACCEPTED': {
          '$sum': {
            '$cond': [ { $eq: [ "$status", "ACCEPTED" ] }, 1, 0 ]
          }
        },
        'REJECTED': {
          '$sum': {
            '$cond': [ { $eq: [ "$status", "REJECTED" ] }, 1, 0 ]
          }
        },
        'FORWARDED': {
          '$sum': {
            '$cond': [{$and : [{ $eq: [ "$status", "PENDING" ] }, {$ne: [`$${commentName}`, ""]}, {$ifNull: [`$${commentName}`, false]}]}, 1, 0]
          }
        }
      }
    }])
    // const records = await renewalModel.find(dbFilterQuery, {
    //   officeAddress: 1,
    //   status: 1,
    // });
    
    // const result = districts.map((x) => {
    //   let ob = {
    //     district: x,
    //     ACTION: 0,
    //     PENDING: 0,
    //     FORWARDED: 0,
    //     ACCEPTED: 0,
    //     REJECTED: 0,
    //   };
    //   return ob;
    // });
    // records.forEach((x) => {
    //   let index = result.findIndex(
    //     (r) => x.officeAddress && x.officeAddress.district && r.district && x.officeAddress.district === r.district
    //   );
    //   if (index > -1) {
    //     let st = x.status;
    //     // if(st === 'PENDING'){
    //     //   for(let i of comments){
    //     //     console.log(i);
    //     //     if(x[i.value]){
    //     //       if(i.role === req.user.role){
    //     //         st='FORWARDED';
    //     //         break;
    //     //       }
    //     //     } else {
    //     //       if(i.role === req.user.role){
    //     //         st='ACTION'
    //     //       }
    //     //       break;
    //     //     }
    //     //   }          
    //     // } 
    //     result[index][st] = result[index][st] + 1;
    //   }
    // });
    res.status(200).json({ data: result });
  } catch (err) {
    logger.error("error ::",err);
    console.log(err);
    res.status(500).send({ ...returnResponseObj(500) });
  }
};

const getApplicationById = async (req, res) => {
  try {
    // application should not be "DRAFT"

    // he should only view application under his area of control
    let query = {applicationId: req.params.appId, status: {$ne: 'DRAFT'}};
    console.log("::::::::query:::::::",query)
     logger.info(`query :::::${query}`);
    if(req.user.role === roleAccessConstants.DR){
      query = {...query, 'officeAddress.district': req.user.district}
    } else if(req.user.role === roleAccessConstants.DIG){
      query = {...query, 'officeAddress.district': {$in: req.user.subDistrict}};
    }
    logger.info(`query :::::${query}`);
    const application = await renewalModel.findOne(query).lean();
    logger.info(`application :::::${application}`);
    if(application){
      const files = await fileModel.find({applicationId: req.params.appId});
      application.aadhaarNumber = application.aadhaarNumber ? maskString(`${application.aadhaarNumber}`, 4) : ''; 
      res.status(200).send({message: "Application fetched successfully", data: application, documents: files});
    } else {
      res.status(404).send({'message': "Application not found", status: false});
    }
  } catch (err){
    logger.error("error ::",err);
    console.log(err);
    res.status(500).send({...returnResponseObj(500)});
  }
}

const getMyDetails = async (req, res) => {
  try {
    const data = await officer.findOne({_id: req.user._id}, {loginPassword: 0});
    logger.info(`data :::::${data}`);
    res.status(200).send({data});
  } catch (err) {
    logger.error("error ::",err);
    res.status(500).json({...returnResponseObj(500)});
  }
}

const getActionItemsCount = async(req, res) => {
  try {
    let query = {status: "PENDING"};
    logger.info(`query :::::${query}`);
 
    let user = req.user;
    logger.info(`user :::::${user}`);
    const comment = comments.filter(c => c.role === user.role)[0];
     logger.info(`comment :::::${comment}`);
    if(user.role === roleAccessConstants.DR){
      query = {...query, 'officeAddress.district': user.district};
    } else if(user.role === roleAccessConstants.DIG){
      query = {...query, 'officeAddress.district': {'$in': user.subDistrict}}
    }

    const prevCommentNames = [];
    for(let i of commentTypes){
      if(i === comment.value){
        break;
      } else {
        prevCommentNames.push(i);
      }
    }
    query = {...query,  [comment.value]: {$in: ['', null]}, type: {$gte: comment.type}};
    for(let i of prevCommentNames){
      query = {...query, [i]: {$exists: true, $ne: ""}};
    }
    const count = await renewalModel.find(query).count();
     logger.info(`count :::::${count}`);
    res.status(200).send({count});
  } catch (err) {
    logger.info(`error :::::${err}`);
    console.log(err);
    res.status(500).send({...returnResponseObj(500)});
  }
}

const getActionItemsList = async(req, res) => {
  try {
    let query = {status: "PENDING"};
    logger.info(`query :::::${query}`);
    const {page, limit} = req.params;
    let user = req.user;
    logger.info(`user :::::${user}`);
    const comment = comments.filter(c => c.role === user.role)[0];
    logger.info(`comment :::::${comment}`);
    if(user.role === roleAccessConstants.DR){
      query = {...query, 'officeAddress.district': user.district};
    } else if(user.role === roleAccessConstants.DIG){
      query = {...query, 'officeAddress.district': {'$in': user.subDistrict}}
    }
    const prevCommentNames = [];
    for(let i of commentTypes){
      if(i === comment.value){
        break;
      } else {
        prevCommentNames.push(i);
      }
    }
    query = {...query, [comment.value]: {$in: ['', null]}, type: {$gte: comment.type}};
    for(let i of prevCommentNames){
      query = {...query, [i]: {$exists: true, $ne: ""}};
    }
    const recordsCount = await renewalModel.count(query);
    logger.info(`recordsCount :::::${recordsCount}`);
      const records = await renewalModel
        .find(query)
        .sort({submissionDate: -1})
        .skip((page - 1) * limit)
        .limit(limit);
      
      res
        .status(200)
        .json({ data: records, totalCount: recordsCount, page: page });
  } catch (err) {
    logger.error("error ::",err);
    console.log(err);
    res.status(500).send({...returnResponseObj(500)});
  }
}

const getRelatedRenewals = async(req, res) => {
  try{
    let list = await renewalModel.find({applicationId: {$ne: req.params.appId}, enrollmentNumber: req.body.enrollment, status: "ACCEPTED"}, {applicationId: 1, newLicenseValidFrom: 1, newLicenseValidFor: 1, type: 1, certificateIssuedDate: 1, certificateEndDate: 1, 'officeAddress.district' : 1, GO_Number: 1});
    logger.info(`list :::::${list}`);
    res.status(200).send({data: list});
  } catch(err){
    logger.error("error ::",err);
    console.log(err);
    res.status(500).send({...returnResponseObj(500)});
  }
}

const changePasswordForOfficers = async(req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(`Notary@321`, salt);
    let list = await officer.updateMany({}, {loginPassword: hashedPassword});

    // for(let i = 0; i < list.length; i++){
     
    //   await officer.findByIdAndUpdate(list[i]._id, {$set: {loginPassword: hashedPassword}})
    // }
    res.status(200).send({message: '200'})
  } catch (err){
    console.log(err);
    res.status(500).send({...returnResponseObj(500)})
  }
}

async function logHistoryofNotary({ applicationId, ipAddress, actionBy, oldData = null }) {
    await loghistoryofNotary.create({
        applicationId,
        ipAddress,
        actionBy,
        oldData
    });
}

const updatedappId = async (req, res) => {
  try {
    const forwarded = req.headers["x-forwarded-for"];
    let ip = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;
    if (ip.indexOf("ffff:") > -1) {
      ip = ip.split("ffff:")[1];
    }
    const userIp = ip;

    const { id } = req.params; 
    const updateData = { ...req.body };
    logger.info(`updateData :::::${updateData}`);

    if (updateData.aadhaarNumber) {
      try {
        updateData.aadhaarNumber = decryptWithAES(String(updateData.aadhaarNumber), 0, false);
      } catch (error) {
        logger.error("error ::",error);
        console.error("Failed to decrypt Aadhaar:", error);
        return res.status(400).send({
          message: "Invalid Aadhaar number",
          status: false
        });
      }
    }

    if (!id) {
      return res.status(400).send({ message: "Application ID is required", status: false });
    }
    let query = {
      applicationId: id,
      status: { $eq: 'ACCEPTED' }
    };

    logger.info(`query :::::${query}`);

    if (req.user.role === roleAccessConstants.DR) {
      query['officeAddress.district'] = req.user.district;
    } else if (req.user.role === roleAccessConstants.DIG) {
      query['officeAddress.district'] = { $in: req.user.subDistrict };
    } else {
      console.log("No district filter applied for role:", req.user.role);
    }

    const notaryData = await renewalModel.findOne(query).lean();
    if (!notaryData) {
      return res.status(404).send({ message: "Application not found", status: false });
    }
    if (!updateData.category || updateData.category.trim() === "") {
      delete updateData.category;
    }
const updatedApplication = await renewalModel.findOneAndUpdate(query,{ $set: updateData }, {
new: true,            
    runValidators: true,  
    }).lean();
    logger.info(`updatedApplication :::::${updatedApplication}`);

    await logHistoryofNotary({
      applicationId: id,
      ipAddress: userIp,
      actionBy: req.user.loginName,
      oldData: notaryData
    });

      return res.status(200).send({
        message: "Application updated successfully",
        data: updatedApplication,
        status: true,
      });

  } catch (error) {
    logger.error("error ::",error);
    console.error(error);
    return res.status(500).send({
      message: "Internal Server Error",
      status: false,
    });
  }
};

module.exports = {
  login,
  acceptApplication,
  updateOfficerDetails,
  getRenewals,
  getStatistics,
  getApplicationById,
  getMyDetails,
  getActionItemsCount,
  getActionItemsList,
  getRelatedRenewals,
  changePasswordForOfficers,
  updatedappId
};
