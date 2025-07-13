// module imports
const otpGenerator = require('otp-generator');

// 1st
exports.generateOTP = () => otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

// 2nd
exports.generateOTP = () => {
  const pin = Math.floor(10000 * Math.random())
    .toString()
    .padStart(6, '0');
  return pin;
};

// 3rd
exports.generateOTP = () => Math.floor(100000 + Math.random() * 900000);
