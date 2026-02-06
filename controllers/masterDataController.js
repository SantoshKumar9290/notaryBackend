const masterData = require('../model/masterDataModel');
const logger = require('../services/winston');
const { returnResponseObj } = require('../utils');

const   getDistricts = async (req, res) => {
    try {
        let districts = await masterData.aggregate([{
            $group: {
                '_id': {'districtName' : `$districtName`},
                'districtCode': {
                    '$first': '$districtCode'
                }
            }},
            {$project: {
                '_id': 0,
                'label': `$_id.districtName`,
                'districtCode': 1 
            }},
            {
                $sort: {
                    'label': 1
                }
        }]);
        logger.info(`districts :::::${districts}`)
        res.status(200).send(districts)
    } catch (err) {
        logger.error("error ::",err)
        console.log(err)
        res.status(500).json({...returnResponseObj(500)})
    } 
}

const getMandals = async (req, res) => {
    try {
        let mandals = await masterData.find({districtName: req.params.district}).distinct('mandalName');
        logger.info(`mandals :::::${mandals}`)
        res.status(200).send({data: mandals})
    } catch (err) {
        logger.error("error ::",err)
        console.log(err)
        res.status(500).json({...returnResponseObj(500)})
    }
}

const getVillages = async (req, res) => {
    try {
        let villages = await masterData.find({districtName: req.params.district, mandalName: req.params.mandal}).distinct('villageName');
        logger.info(`villages :::::${villages}`)
        res.status(200).send({data: [...villages]})
    } catch (err) {
        logger.error("error ::",err)
        console.log(err)
        res.status(500).json({...returnResponseObj(500)})
    }
}

module.exports = {getDistricts, getMandals, getVillages};