const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a text value']
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    aadhaar: {
        type: Number,
        unique: true,
        required: true
    },
    mobile: {
        type: Number,
        unique: true,
        required: true
    },
    lastLoginTime: {
        type: String
    },
    token: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('user', UserSchema);