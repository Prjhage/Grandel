# Grandel - Project Workflow Documentation

This document visually and technically details the primary end-to-end workflows of the Grandel platform.

---

## 📑 Workflows Index
1. [User Registration & Authentication](#1-user-registration--authentication-flow)
2. [Property Creation & Management](#2-property-creation--management-flow)
3. [Booking Lifecycle & Pricing Flow](#3-booking-lifecycle--pricing-flow)
4. [Payment & Cryptographic Verification](#4-payment--cryptographic-verification-flow)
5. [QR Check-in & Host Verification](#5-qr-check-in--host-verification-flow)

---

## 1. User Registration & Authentication Flow

Covers how guests and hosts register, verify identities through Firebase, link accounts to MongoDB, and obtain secure cross-domain sessions.

![User Registration Flow](user-registration.png)

```mermaid
sequenceDiagram
    autonumber
    actor User as Guest / Host
    participant UI as React Client (Vite)
    participant FB as Firebase Auth Service
    participant API as Express API Server
    participant DB as MongoDB Atlas

    User->>UI: Enter Email/Password or click "Google Sign In"
    UI->>FB: Authenticate credentials / OAuth popup
    FB-->>UI: Return Cryptographic ID Token (JWT)
    UI->>API: POST /firebase-login (Bearer <ID Token>)
    API->>FB: Verify ID Token signature (Firebase Admin SDK)
    FB-->>API: Decoded UID & Email verified
    API->>DB: Find or create User record (Bcrypt hash phone)
    DB-->>API: User document
    API->>API: Initialize Passport Session (req.login)
    API-->>UI: Set-Cookie: connect.sid (HttpOnly, Secure, SameSite=None)
    UI-->>User: Welcome to Grandel Dashboard!
```

---

## 2. Property Creation & Management Flow

Details the host property creation journey, multi-image Cloudinary streaming, and 2dsphere spherical coordinate indexing.

![Property Management Flow](property-management.png)

```mermaid
sequenceDiagram
    autonumber
    actor Host
    participant UI as Host Web Interface
    participant API as Express API Server
    participant Cloud as Cloudinary CDN
    participant DB as MongoDB Atlas

    Host->>UI: Fill Listing Form (Title, Category, Price, Rooms, Pets, Discount)
    Host->>UI: Select Cover Image & Gallery Photos
    Host->>UI: Click "Publish Listing"
    UI->>API: POST /listings (multipart/form-data)
    API->>API: unflattenBody() helper + Joi validation
    API->>Cloud: Stream images via multer-storage-cloudinary
    Cloud-->>API: Return secure URLs & filenames
    API->>API: Map location to GeoJSON Point [lng, lat]
    API->>DB: Insert new Listing (Owner: req.user._id)
    API->>DB: Sync 2dsphere index
    DB-->>API: Listing created with _id
    API-->>UI: 200 OK (Listing Published)
    UI-->>Host: Display Listing on Live Map & Host Dashboard
```

---

## 3. Booking Lifecycle & Pricing Flow

Illustrates calendar availability checks, extra guest & pet surcharges, 18% GST calculation, early bird discounts, and AI itinerary compilation.

![Booking Flow](booking-flow.png)

```mermaid
sequenceDiagram
    autonumber
    actor Guest
    participant UI as Grandel Booking Page
    participant API as Express API Server
    participant DB as MongoDB Atlas
    participant AI as Gemini 2.5 Flash

    Guest->>UI: Select Check-in & Check-out dates
    Guest->>UI: Select Guests (Adults, Children, Pets)
    UI->>API: POST /listings/:id/book/initiate
    API->>DB: Query for overlapping confirmed bookings
    DB-->>API: Date availability confirmed
    API->>API: Calculate Base Nights + Surcharges + 18% GST
    API->>DB: Check if first booking today -> Apply 20% Early Bird Discount
    API->>AI: Fetch tourist landmarks & food suggestions
    AI-->>API: Return JSON itinerary & plan
    API-->>UI: Return Price Breakdown & 20% Token Amount
    UI-->>Guest: Present Payment Summary & Reserve Button
```

---

## 4. Payment & Cryptographic Verification Flow

Demonstrates the 20% token deposit payment split, client-side Razorpay modal injection, and server-side HMAC-SHA256 signature verification.

![Payment Flow](payment-flow.png)

```mermaid
sequenceDiagram
    autonumber
    actor Guest
    participant UI as React App
    participant API as Express Server
    participant RZP as Razorpay API
    participant DB as MongoDB Atlas
    participant N8N as n8n Webhook Service

    Guest->>UI: Click "Pay Token & Reserve"
    UI->>API: POST /listings/:id/book/initiate
    API->>RZP: Create Order (amount: 20% in paise, currency: INR)
    RZP-->>API: Return Order ID (order_OD948...)
    API-->>UI: Order ID & Public Razorpay Key
    UI->>RZP: Launch Razorpay Checkout Modal (UPI / Card)
    Guest->>RZP: Authorize Payment
    RZP-->>UI: Return razorpay_payment_id & razorpay_signature
    UI->>API: POST /listings/:id/book/verify (with payment signatures)
    API->>API: Compute crypto.createHmac("sha256", SECRET)
    API->>API: Verify computed signature === razorpay_signature
    API->>DB: Save Booking (status: "pending", tokenPaid: 20%)
    API->>N8N: Dispatch host_notification webhook
    API-->>UI: 200 OK (Booking Confirmed)
    UI-->>Guest: Redirect to Booking Confirmation & PDF Invoice
```

---

## 5. QR Check-in & Host Verification Flow

Details the invoice generation with vector QR barcodes, mobile camera scanning, host ownership validation, and remaining balance due calculation.

![QR Verification Flow](qr-verification-flow.png)

```mermaid
sequenceDiagram
    autonumber
    actor Guest
    actor Host
    participant UI as Host Scanner (/profile/host/scanner)
    participant API as Express API Server
    participant DB as MongoDB Atlas

    Guest->>Guest: Displays PDF Invoice with QR Code (bwip-js)
    Host->>UI: Open Host Check-in Scanner
    UI->>UI: Request camera access (html5-qrcode)
    UI->>UI: Point camera at Guest QR Code
    UI->>UI: Decode bookingId from QR
    UI->>API: GET /bookings/verify/:bookingId
    API->>DB: Find Booking by ID & populate listing.Owner
    DB-->>API: Booking & Listing records
    API->>API: Security check: Is listing.Owner === req.user._id?
    alt Authorized Host
        API->>API: Calculate Token Paid (20%) and Balance Due (80%)
        API-->>UI: 200 OK with Guest Name, Dates, and Balance Due
        UI-->>Host: Display Green Success Card & Check-in Details
    else Unauthorized User
        API-->>UI: 403 Forbidden ("Unauthorized: Booking belongs to another property")
        UI-->>Host: Display Red Security Warning Card
    end
```
