const axios = require("axios");

/**
 * n8nService handles secured communication with n8n webhooks.
 * It uses an API key to authenticate requests to n8n.
 */
class n8nService {
    constructor() {
        this.otpWebhookUrl = process.env.N8N_OTP_WEBHOOK_URL;
        this.emailWebhookUrl = process.env.N8N_EMAIL_WEBHOOK_URL;
        this.apiKey = process.env.N8N_API_KEY; // Secure key for n8n validation
    }

    /**
     * Sends an OTP to a mobile number via n8n.
     * @param {string} phone - The recipient's phone number.
     * @param {string} otp - The generated OTP code.
     */
    async sendOTP(phone, otp) {
        if (!this.otpWebhookUrl) {
            console.error("n8nService: N8N_OTP_WEBHOOK_URL is not defined.");
            return { success: false, message: "Webhook URL missing" };
        }

        try {
            const response = await axios.post(this.otpWebhookUrl, {
                phone,
                otp,
                timestamp: new Date().toISOString()
            }, {
                headers: {
                    "X-N8N-API-KEY": this.apiKey,
                    "Content-Type": "application/json"
                }
            });

            return { success: true, data: response.data };
        } catch (error) {
            const errorMsg = error.response ?
                `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}` :
                error.message;
            console.error("n8nService Error (sendOTP):", errorMsg);
            return { success: false, error: errorMsg };
        }

    }

    /**
     * Sends a booking confirmation email via n8n.
     * @param {string} email - Recipient email.
     * @param {object} bookingDetails - Object containing booking info.
     * @param {string} type - Type of email ('guest_confirmation', 'host_notification', 'guest_thanks')
     */
    async sendBookingConfirmation(email, bookingDetails, type = 'guest_confirmation') {
        if (!this.emailWebhookUrl) {
            console.error("n8nService: N8N_EMAIL_WEBHOOK_URL is not defined.");
            return { success: false, message: "Webhook URL missing" };
        }

        try {
            const response = await axios.post(this.emailWebhookUrl, {
                email,
                type, // 'guest_confirmation', 'host_notification', or 'guest_thanks'
                booking: bookingDetails,
                timestamp: new Date().toISOString()
            }, {
                headers: {
                    "X-N8N-API-KEY": this.apiKey,
                    "Content-Type": "application/json"
                }
            });

            return { success: true, data: response.data };
        } catch (error) {
            console.error("n8nService Error (sendBookingConfirmation):", error.response ? error.response.data : error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new n8nService();
