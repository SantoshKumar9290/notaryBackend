const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "user"
    },
    applicationId: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('file', fileSchema);