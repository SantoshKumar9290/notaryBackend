const mongoose = require('mongoose');

var paymentReceipt = new mongoose.Schema({
	applicationNumber: {type: String},
    departmentTransID: {type: String},
    cfmsTransID: {type: String},
    transactionStatus: {type: String},
    amount: {type: Number},
    totalAmount: {type: Number},
    paymentMode: {type: String},
    isUtilized: {type: Boolean},
    bankTransID: {type: String},
    bankTimeStamp: {type: Date},
    createdAt: {type: Date}
});


const PaymentReceiptDetails = mongoose.model('paymentreceipts', paymentReceipt);

module.exports = PaymentReceiptDetails;