const nodemailer = require("nodemailer");

/**
 * Mail Service for direct SMTP emails
 */
class MailService {
    constructor() {
        // Transporter configuration (e.g., Gmail, Outlook, SMTP)
        this.transporter = nodemailer.createTransport({
            service: "gmail", // Change if using another service
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS, // Use App Password for Gmail
            },
        });
    }

    /**
     * Send Password Reset Email
     * @param {string} to - Recipient email
     * @param {string} resetUrl - Full URL to the reset password page
     */
    async sendResetEmail(to, resetUrl) {
        const mailOptions = {
            from: `"Grandel Support" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: "Password Reset Request - Grandel",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #6C3CE0; margin: 0;">Grandel</h1>
                    </div>
                    <p>Hello,</p>
                    <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
                    <p>Please click on the following button to complete the process:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #6C3CE0; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p>This link will remain active for **1 hour**. If you did not request this, please ignore this email and your password will remain unchanged.</p>
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777;">Regards,<br>Grandel Team</p>
                </div>
            `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log("Email sent: " + info.response);
            return { success: true };
        } catch (error) {
            console.error("Mail Service Error:", error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new MailService();
