require('dotenv').config();
const mailService = require('./services/mailService');

async function testMail() {
    console.log("Testing mail with:", process.env.EMAIL_USER);
    const result = await mailService.sendResetEmail(process.env.EMAIL_USER, "http://localhost:5173/test-reset");
    console.log("Result:", result);
    process.exit(result.success ? 0 : 1);
}

testMail();
