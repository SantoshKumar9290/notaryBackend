const {
  DISTRICTLIST,
  CITYLIST,
  NOTARYHOLDERLIST,
} = require("../constants/data");
const { returnResponseObj } = require("../utils");

const notaryHolderListModel = require("../model/notaryHolderListModel");
const axios = require("axios");
const logger = require("../services/winston");

const getDistricts = async (req, res) => {
  try{
    console.log("Inside of getDistricts ::::: ");
    let districts = await notaryHolderListModel.distinct("districtName");
    console.log("End of getDistricts ::::: ");
    logger.info(`districts :::::${districts}`)
    return res.status(200).send({
      status: true,
      code: "200",
      message: "Success",
      data: districts,
    });
  } catch (err) {
    logger.error("error :::",err)
    console.log(err);
    res.status(500).send({ ...returnResponseObj(500) });
  }
};

const getNotaryHolderListByDistrict = async (req, res) => {
  try {
    console.log("Inside of getNotaryHolderListByDistrict ::::: ");
    let response;
    if (req.params.districtId == "All") {
      response = await notaryHolderListModel.find({});
    } else {
      response = await notaryHolderListModel.find({districtName:req.params.districtId});
    }
    logger.info(`response :::::${response}`);
    console.log("End of getNotaryHolderListByDistrict ::::: ");
    return res.status(200).send({
      status: true,
      code: "200",
      message: "Success",
      data: response,
    });
  } catch (err) {
    logger.error("error :::",err)
    console.log(err);
    res.status(500).send({ ...returnResponseObj(500) });
  }
};

module.exports = { getDistricts, getNotaryHolderListByDistrict };
