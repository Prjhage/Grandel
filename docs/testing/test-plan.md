# Grandel - Quality Assurance & Test Plan

## 1. Test Strategy & Scope
This test plan establishes the quality verification standards for the Grandel platform. Testing encompasses functional correctness, cryptographic validation, database performance, geospatial indexing, session reliability across distributed domains, and external integration fail-safes.

---

## 2. Test Environments
| Environment | Configuration | Purpose |
| :--- | :--- | :--- |
| **Local Development** | Node 22, Vite, MongoDB Atlas (Dev Cluster), Localhost:8080 & Localhost:5173 | Rapid feature verification, manual and unit testing. |
| **Staging / CI** | Automated test scripts (`Backend/test-*.js`) hitting dedicated test databases | Regression validation and benchmark auditing. |
| **Production** | Vercel (Frontend Edge CDN) + Render (Node.js 22 Web Service) + MongoDB Atlas | Live smoke tests, cross-domain cookie validation, and health monitoring. |

---

## 3. Test Levels & Methodology

### 3.1 Unit & Script Testing
- Automated standalone test scripts checking data aggregations (`test-aggregation.js`), Node-Cache throughput (`test-caching.js`), and direct SMTP email dispatch (`test-mail.js`).

### 3.2 Integration Testing
- **Payment Verification**: Validating Razorpay order initiation, token amount calculation, and HMAC-SHA256 signature verification logic.
- **Geospatial Queries**: Validating `$near` spherical distance filtering with valid coordinates and ensuring graceful fallback for unmapped searches.
- **Double Booking**: Validating date overlap queries to prevent multiple reservations on identical dates.

### 3.3 Security & Penetration Testing
- Rate limit enforcement on global API (300 req / 15 min) and Chatbot (10 req / 1 min).
- NoSQL injection sanitizer verifying that `$`-prefixed operators are stripped from query and body payloads.
- Role-based access controls ensuring standard users cannot access host dashboards or delete unauthorized listings.

### 3.4 User Acceptance & Hardware Testing
- QR scanner camera access (`html5-qrcode`) on mobile browsers under HTTPS.
- Interactive Leaflet map zooming, panning, and pin popup interaction.
- Chatbot reservation action button parsing and redirection.
