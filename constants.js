const errorMessages = {
    '500': 'Internal Server Error',
    '401': "Unauthorized Access. Token Expired",
    '403': "Forbidden Access",
    "400": "Invalid Request"
};

const roleAccessConstants = {
    User: 'USER',
    DR: 'DR',
    DIG: 'DIG',
    IG: 'IG',
    GOV: 'GOV'
};

const updateOfficerType = {
    LoginName: 'LoginName',
    Password: 'Password'
};

const roleNames = {
    "DR": "DISTRICT REGISTRAR (R&S)",
    "DIG": "DEPUTY INSPECTOR GENERAL (R&S)",
    "IG": "INSPECTOR GENERAL (R&S)",
    "GOV": "GOVERNMENT"
};

const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
const nameRegex = /^[a-zA-Z].*[\s]*/;
const dateRegex = /^\d{4}[-]\d{2}[-]\d{2}$/;
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
const comments = [{'label': 'DR Comments', 'value': 'DR_Comment', 'role': roleAccessConstants.DR, type: 0, status: "Forwarded to DR"}, {'label': 'DIG Comments', 'value': 'DIG_Comment', 'role' : roleAccessConstants.DIG, type: 1, status: "Forwarded to DIG"}, {'label': 'IG Comments', 'value': 'IG_Comment', 'role': roleAccessConstants.IG, type: 2, status: "Forwarded to IG"}, {'label': "Government Comments", 'value': 'GOV_Comment', 'role': roleAccessConstants.GOV, type: 3, status: "Forwarded to GOV of A.P"}];
const commentTypes = ['DR_Comment', 'DIG_Comment', 'IG_Comment', 'GOV_Comment'];

module.exports = {errorMessages, emailRegex, nameRegex, dateRegex, passwordRegex, updateOfficerType, roleAccessConstants, roleNames, comments, commentTypes};