const axios = require("axios");

/**
 * n8nService handles secured communication with n8n webhooks.
 * It uses an API key to authenticate requests to n8n.
 */
class n8nService {
    constructor() {
        this.emailWebhookUrl = process.env.N8N_EMAIL_WEBHOOK_URL;
        this.apiKey = process.env.N8N_API_KEY; // Secure key for n8n validation
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
            const payload = {
                email,
                type, // 'guest_confirmation', 'host_notification', or 'guest_thanks'
                booking: bookingDetails,
                timestamp: new Date().toISOString()
            };
            console.log(`[n8nService Debug] Sending TYPE: "${payload.type}" to ${payload.email}`);

            const response = await axios.post(this.emailWebhookUrl, payload, {
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
