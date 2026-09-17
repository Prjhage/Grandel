# Feature: Notification & Messaging System

## 1. Purpose
Provides automated, event-driven communications to guests and property hosts across key milestones in the reservation lifecycle. Leverages secured `n8n` webhooks for high-deliverability templated messaging and direct Nodemailer SMTP for transactional account security emails.

---

## 2. Workflow
1. **Booking Lifecycle Webhooks (`n8nService`)**:
   - **Booking Creation**: When a payment is verified, the server triggers:
     - `host_notification`: Informs the property host of a new reservation with dates and guest contact information.
     - `guest_request`: Notifies the guest that their deposit was received.
   - **Host Confirmation**: When a host marks a booking `confirmed`, `n8nService` sends a `guest_confirmation` email.
   - **Check-Out Completion**: When a stay is marked `completed`, `n8nService` sends a `guest_thanks` email containing post-stay recommendations.
2. **Direct SMTP Transport (`mailService`)**:
   - Handles password reset requests directly over TLS using Nodemailer and Gmail App Password authentication.

---

## 3. Components Involved
- `Backend/services/n8nService.js`: Webhook client transmitting structured payloads with `X-N8N-API-KEY` authentication headers.
- `Backend/services/mailService.js`: Nodemailer SMTP transporter sending styled HTML reset emails.
- `Backend/controllers/bookings.js`: Dispatches initial booking creation notifications.
- `Backend/routes/user.js`: Dispatches status update notifications (`confirmed`, `completed`).

---

## 4. APIs Involved
- `POST /listings/:id/book/verify`: Triggers booking creation alerts.
- `POST /profile/host/bookings/:id/status`: Triggers lifecycle status notifications.
- `POST /forgot-password`: Triggers SMTP password reset email.

---

## 5. Database Collections
- **`users`**: Source for guest and host email addresses.
- **`bookings`**: Populated with listing title, dates, and total amount.

---

## 6. External Services
- **n8n Workflow Automation Engine**: Receives webhooks and orchestrates multi-channel delivery (Email, Slack, or SMS).
- **Gmail SMTP / Nodemailer**: Direct email delivery.

---

## 7. Important Implementation Details
- **Fail-Safe Webhook Dispatch**: All calls to `n8nService.sendBookingConfirmation` are wrapped in non-blocking `try/catch` blocks. If n8n is temporarily offline or rate-limited, the customer's booking confirmation is **never** interrupted or aborted.
- **API Key Security**: Outbound webhook calls transmit `headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY }` to prevent unauthorized webhook invocation.

---

## 8. Known Limitations
- When running n8n locally on `http://localhost:5678`, webhook dispatch requires n8n to be running. If running the backend on Render cloud, `N8N_EMAIL_WEBHOOK_URL` must point to a publicly accessible HTTPS webhook endpoint.
