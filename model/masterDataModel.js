const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const masterDataSchema = new Schema({
    revDistCode: { type: String },
    districtName: { type: String },
    districtCode: {type: String},
    revMandalCode: { type: String },
    mandalName: { type: String },
    revVillageCode: { type: String },
    villageName: { type: String },
    villageScretariatCode: { type: String },
    villageScretariatName: { type: String },
    parentSroCode: { type: String },
    sroName: { type: String },
    psName: { type: String },
    psAdhaarNo: { type: String },
    psMobileNo: { type: String },
    vroName: { type: String },
    vroAdhaarNo: { type: String },
    vroMobile: { type: String },
    gswsSystemMacAddress: { type: String }

});

module.exports = mongoose.model("masterData", masterDataSchema, "masterData");
