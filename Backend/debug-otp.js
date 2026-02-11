require('dotenv').config();
const axios = require('axios');

async function testOtp() {
    const url = process.env.N8N_OTP_WEBHOOK_URL;
    const apiKey = process.env.N8N_API_KEY;
    const phone = "+919876543210"; // Test number
    const otp = "123456";

    console.log(`Testing OTP: ${url}`);
    console.log(`API Key: ${apiKey}`);

    try {
        const res = await axios.post(url, {
            phone,
            otp,
            timestamp: new Date().toISOString()
        }, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        console.log("Success! n8n response:", res.data);
    } catch (err) {
        console.error("Failed!");
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", err.response.data);
        } else {
            console.error("Message:", err.message);
        }
    }
}

testOtp();
