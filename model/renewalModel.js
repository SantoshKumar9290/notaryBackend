const mongoose = require('mongoose');

const renewalSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "user"
    },
    type: {
        required: true,
        type: Number
    },
    enrollmentNumber: {
        required: true,
        type: String
    },
    certificateIssuedDate: {
        type: Date,
    },
    certificateEndDate: {
        type: Date
    },
    aadhaarNumber: {
        type: Number,
        required: false,
    },
    name: {
        type: String,
        required: true
    },
    relationType: {
        type: String,
        required: true,
        enum: ['S/O', 'D/O', 'C/O', 'W/O']
    },
    relationName: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female']
    },
    email: {
        type: String,
    },
    mobile: {
        type: Number,
        min: 1000000000,
        max: 9999999999
    },
    officeAddress: {
        doorNo: {type: String},
        street: {type: String},
        district: {type: String},
        mandal: {type: String},
        village: {type: String},
        pincode: {type: Number}
    },
    homeAddress: {
        doorNo: {type: String},
        street: {type: String},
        district: {type: String},
        mandal: {type: String},
        village: {type: String},
        pincode: {type: Number}
    },
    applicationId: {type: String, unique: true, required: true},
    status: {type: String, enum: ['DRAFT', 'PENDING', 'REJECTED', 'ACCEPTED']},
    DR_Comment: {type: String},
    DIG_Comment: {type: String},
    IG_Comment: {type: String},
    GOV_Comment: {type: String},
    submissionDate: {type: Date},
    actionDate: {type: Date},
    cert_form: {type: Boolean},
    reject_cert_form: {type: Boolean},
    rejection_comment: {type: String},
    newLicenseValidFrom: {type: Date},
    newLicenseValidFor: {type: Date},
    GO_Number: {type: Number},
    GO_SlNo: {type: Number}
}, {
    timestamps: true
})

module.exports = mongoose.model('renewal', renewalSchema);