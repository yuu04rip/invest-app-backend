function generateOTP() {
    // OTP di 6 cifre
    return Math.floor(100000 + Math.random() * 900000).toString();
}
module.exports = generateOTP;