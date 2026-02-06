const { errorMessages, emailRegex, nameRegex, dateRegex } = require('./constants');
const CryptoJs = require('crypto-js');
const jwt = require('jsonwebtoken');

const returnResponseObj = (statusCode = 500) => {
    return { status: false, message: errorMessages[`${statusCode}`] };
}

const emailValidation = (value) => {
    return emailRegex.test(value)
}

const mobileValidation = (value) => {
    if (typeof value !== 'number' && `${value}`.length !== 10) {
        return false;
    } else {
        return true;
    }
}

const aadhaarValidation = (value) => {
    if (typeof value !== 'number' || `${value}`.length !== 12) {
        return false;
    } else {
        return true;
    }
}

const nameValidation = (value) => {
    if(value && typeof value === 'string' && value.length >= 4 && value.length <= 40 
    // && nameRegex.test(value)
    ){
        return true;
    }
    return false;
}

const minStrLengthValidation = (value) => {
    if(value && typeof value === 'string' && value.length > 0){
        return true;
    }
    return false;
}

const addressValidation = (value) => {
    if(value && typeof value === 'object'
        && typeof value.doorNo === 'string' && value.doorNo.trim().length > 0
        && typeof value.street === 'string' && value.street.trim().length > 0
        && typeof value.district === 'string' && value.district.trim().length > 0
        && typeof value.mandal === 'string' && value.mandal.trim().length > 0
        && typeof value.village === 'string' && value.village.trim().length > 0
        && typeof value.pincode === 'number' && `${value.pincode}`.length === 6){
            return true;
    }
    else {
        return false;
    }
}

const commentValidation = (value) => {
    return value && typeof value === 'string' && value.length > 0 && value.length <= 500;
}

const dateValidation = (value) => {
    return value && dateRegex.test(value.toString());
}

const decryptWithAES = (ciphertext, flag=0, donotConvertToNum=true) => {
    let num;
    try {
        const passphrase = flag ? process.env.ciperText2.toString() : process.env.adhar_Secret_key.toString();
        const bytes = CryptoJs.AES.decrypt(ciphertext, passphrase);
        const originalText = bytes.toString(CryptoJs.enc.Utf8);
        num = donotConvertToNum ? originalText : Number(originalText);
    } catch (err) {
        num = null
    }
    return num;
};

const encryptWithAES = (text) => {
    const passphrase = process.env.ciperText2.toString();
    return CryptoJs.AES.encrypt(text, passphrase).toString();
  };

// generate jwt

const generateToken = (data) => {
    return encryptWithAES(jwt.sign({...data}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    }))
}

const getDateFormat = (d) => {
     d = d ? new Date(d) : new Date();
    return `${d.getDate() > 9 ? d.getDate() : `0${d.getDate()}`}/${(d.getMonth() + 1) > 9 ? (d.getMonth() + 1) : `0${d.getMonth() + 1}`}/${d.getFullYear()}`;
}

const addYears = (d1, years) => {
    const d = d1 ? new Date(d1) : new Date();
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString();
}

 const addDays = (d1, days) => {
    let d = d1 ? new Date(d1) : new Date();
    d.setDate(d.getDate() + Number(days));
    return d;
  }

 const currentTime = () => {
   let date = new Date();
   let dateStr =
		("00" + date.getDate()).slice(-2) + "-" +
        ("00" + (date.getMonth() + 1)).slice(-2) + "-" +
		date.getFullYear() + " " +
		("00" + date.getHours()).slice(-2) + ":" +
		("00" + date.getMinutes()).slice(-2) + ":" +
		("00" + date.getSeconds()).slice(-2);
    return dateStr;
 }

 const maskString = (str, n) => {
    if (str.length <= n) {
      return str;
    }
    const maskedLength = str.length - n;
    return "X".repeat(maskedLength) + str.slice(maskedLength, str.length);
  }
module.exports = { returnResponseObj, emailValidation, mobileValidation, aadhaarValidation, decryptWithAES, minStrLengthValidation, nameValidation, addressValidation, dateValidation, commentValidation, generateToken, getDateFormat, addYears, addDays, currentTime, encryptWithAES, maskString};
