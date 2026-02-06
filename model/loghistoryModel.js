const mongoose = require("mongoose");

const notaryAuditSchema = new mongoose.Schema({
    applicationId: {type:String},
    ipAddress: {type:String},
    actionBy: {type:String},
    actionOn: { type: Date, default: Date.now },
    oldData:  {type:mongoose.Schema.Types.Mixed},
});

module.exports = mongoose.model("loghistory", notaryAuditSchema);