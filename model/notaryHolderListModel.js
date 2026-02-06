const mongoose = require('mongoose');

const notaryHolderListSchema = new mongoose.Schema({
    districtName: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    qualification: {
        type: String,
        required: true
    },
    notaryDetails: {
        type: String,
        required: true
    },
    validityUpto: {
        type: String,
        required: true
    },
    authorizedArea: {
        type: String,
        required: true
    },
    professionalAddress: {
        type: String,
        required: true
    },
    residentialAddress: {
        type: String,
        required: true
    },
    barCouncilNo: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('notaryHolderList', notaryHolderListSchema, 'notaryHolderList');