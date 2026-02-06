const mongoose = require('mongoose');

const officerSchema = new mongoose.Schema({
    loginName: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['DR', 'DIG', 'IG', 'GOV']
    },
    loginPassword: {
        type: String,
        required: true,
    },
    loginEmail: {
        type: String,
        required: true,
        unique: true
    },
    district: {
        type: String,
    },
    subDistrict: {
        type: Array
    },
    designation: {
        type: String
    },
    lastLoginTime: {
        type: String
    },
    token: {
        type: String
    },
    loginAttempts: {
        type: Number,
        default: 5
    },
    loginBlockedUntil: {
        type: Date
    },
    isPasswordUpdated: {
        type: Boolean
    },
});

module.exports = mongoose.model('officer', officerSchema);