import os
from PIL import Image, ImageDraw, ImageFont

def get_font(size=14, bold=False):
    # Try common Windows fonts
    font_names = ["segoeui.ttf", "segoeuib.ttf" if bold else "segoeui.ttf", "arial.ttf", "arialbd.ttf" if bold else "arial.ttf"]
    for name in font_names:
        try:
            return ImageFont.truetype(name, size)
        except IOError:
            continue
    return ImageFont.load_default()

def draw_rounded_rect(draw, box, radius=12, fill="#1e293b", outline="#3b82f6", width=2):
    x0, y0, x1, y1 = box
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill, outline=outline, width=width)

def draw_arrow(draw, start, end, color="#94a3b8", width=2, arrow_size=8):
    x0, y0 = start
    x1, y1 = end
    draw.line([x0, y0, x1, y1], fill=color, width=width)
    import math
    angle = math.atan2(y1 - y0, x1 - x0)
    # Arrowhead points
    p1 = (x1 - arrow_size * math.cos(angle - math.pi / 6), y1 - arrow_size * math.sin(angle - math.pi / 6))
    p2 = (x1 - arrow_size * math.cos(angle + math.pi / 6), y1 - arrow_size * math.sin(angle + math.pi / 6))
    draw.polygon([end, p1, p2], fill=color)

def generate_system_architecture(output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    width, height = 1200, 800
    img = Image.new("RGB", (width, height), "#0f172a")
    draw = ImageDraw.Draw(img)

    title_font = get_font(26, bold=True)
    subtitle_font = get_font(14)
    box_title_font = get_font(15, bold=True)
    text_font = get_font(12)

    # Header
    draw.text((60, 40), "Grandel - System Architecture", fill="#f8fafc", font=title_font)
    draw.text((60, 75), "Comprehensive Full-Stack & Cloud Integration Overview", fill="#94a3b8", font=subtitle_font)

    # 1. Client Layer
    draw_rounded_rect(draw, (60, 130, 1140, 220), radius=10, fill="#1e293b", outline="#6366f1", width=2)
    draw.text((80, 145), "CLIENT APPLICATION LAYER (Frontend - React 19 + Vite)", fill="#818cf8", font=box_title_font)
    draw.text((80, 175), "• SPA Routing (React Router v7)    • Leaflet Interactive Maps    • HTML5-QRCode Scanner", fill="#e2e8f0", font=text_font)
    draw.text((80, 195), "• Axios HTTP Client with BaseURL detection & Credential handling    • In-Memory Context Caching", fill="#cbd5e1", font=text_font)

    # Arrow to API
    draw_arrow(draw, (600, 220), (600, 270), color="#6366f1", width=3)
    draw.text((615, 235), "REST API / JSON / Session Cookies", fill="#a5b4fc", font=get_font(11))

    # 2. Gateway / Security Middleware
    draw_rounded_rect(draw, (60, 270, 1140, 360), radius=10, fill="#1e293b", outline="#0284c7", width=2)
    draw.text((80, 285), "API GATEWAY & SECURITY MIDDLEWARE (Node.js 22 + Express 5.1)", fill="#38bdf8", font=box_title_font)
    draw.text((80, 315), "• Helmet (Security Headers)    • Rate Limiting (express-rate-limit)    • HPP (Parameter Pollution Defense)", fill="#e2e8f0", font=text_font)
    draw.text((80, 335), "• Custom NoSQL Sanitization    • Passport.js Session Auth    • MongoStore Session Persistence", fill="#cbd5e1", font=text_font)

    # Arrows to Backend Modules
    draw_arrow(draw, (230, 360), (230, 410), color="#0284c7", width=2)
    draw_arrow(draw, (600, 360), (600, 410), color="#0284c7", width=2)
    draw_arrow(draw, (970, 360), (970, 410), color="#0284c7", width=2)

    # 3. Core Service Modules
    # Auth & Users
    draw_rounded_rect(draw, (60, 410, 400, 520), radius=8, fill="#1e293b", outline="#10b981", width=2)
    draw.text((80, 425), "Authentication & Users", fill="#34d399", font=box_title_font)
    draw.text((80, 455), "• Firebase Token Verification", fill="#e2e8f0", font=text_font)
    draw.text((80, 475), "• Bcrypt Hashed Phone/Passwords", fill="#e2e8f0", font=text_font)
    draw.text((80, 495), "• Role Access Control (User/Host)", fill="#e2e8f0", font=text_font)

    # Booking & Payments
    draw_rounded_rect(draw, (430, 410, 770, 520), radius=8, fill="#1e293b", outline="#f59e0b", width=2)
    draw.text((450, 425), "Booking Engine & Razorpay", fill="#fbbf24", font=box_title_font)
    draw.text((450, 455), "• Date Availability & Overlap Check", fill="#e2e8f0", font=text_font)
    draw.text((450, 475), "• 20% Token Order & HMAC-SHA256", fill="#e2e8f0", font=text_font)
    draw.text((450, 495), "• PDFKit Invoicing & bwip-js QR", fill="#e2e8f0", font=text_font)

    # Properties & Reviews
    draw_rounded_rect(draw, (800, 410, 1140, 520), radius=8, fill="#1e293b", outline="#ec4899", width=2)
    draw.text((820, 425), "Listings, Reviews & Search", fill="#f472b6", font=box_title_font)
    draw.text((820, 455), "• 2dsphere Geospatial Search ($near)", fill="#e2e8f0", font=text_font)
    draw.text((820, 475), "• Multi-Cloudinary Image Upload", fill="#e2e8f0", font=text_font)
    draw.text((820, 495), "• Atomic Aggregate Review Math", fill="#e2e8f0", font=text_font)

    # Arrow to Database
    draw_arrow(draw, (600, 520), (600, 570), color="#10b981", width=3)

    # 4. Database Layer
    draw_rounded_rect(draw, (60, 570, 1140, 650), radius=10, fill="#1e293b", outline="#10b981", width=2)
    draw.text((80, 585), "PERSISTENCE LAYER (MongoDB Atlas + Mongoose ODM)", fill="#34d399", font=box_title_font)
    draw.text((80, 615), "• Users Collection    • Listings Collection (GeoJSON)    • Bookings Collection    • Reviews Collection", fill="#e2e8f0", font=text_font)

    # 5. External Services Layer
    services = [
        ("Firebase Auth", "Token Validation", "#f97316", 60),
        ("Cloudinary CDN", "Image Storage", "#06b6d4", 280),
        ("Razorpay Gateway", "Payments & Webhooks", "#3b82f6", 500),
        ("Groq / Gemini AI", "Llama-3 & Travel Plan", "#8b5cf6", 720),
        ("n8n Automation", "Email Alerts Webhooks", "#ec4899", 940),
    ]

    for title, desc, col, x in services:
        draw_arrow(draw, (x + 90, 650), (x + 90, 690), color=col, width=2)
        draw_rounded_rect(draw, (x, 690, x + 200, 760), radius=8, fill="#1e293b", outline=col, width=2)
        draw.text((x + 15, 705), title, fill=col, font=get_font(13, bold=True))
        draw.text((x + 15, 730), desc, fill="#94a3b8", font=get_font(11))

    img.save(output_path, "PNG")
    print(f"Saved: {output_path}")

def generate_er_diagram(output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    width, height = 1200, 750
    img = Image.new("RGB", (width, height), "#0f172a")
    draw = ImageDraw.Draw(img)

    title_font = get_font(24, bold=True)
    sub_font = get_font(13)
    header_font = get_font(14, bold=True)
    item_font = get_font(11)

    draw.text((60, 40), "Grandel - MongoDB Database Entity-Relationship Diagram", fill="#f8fafc", font=title_font)
    draw.text((60, 75), "Mongoose Schemas, Cross-Collection References, and Aggregations", fill="#94a3b8", font=sub_font)

    # User Box
    draw_rounded_rect(draw, (60, 130, 310, 450), radius=8, fill="#1e293b", outline="#3b82f6", width=2)
    draw_rounded_rect(draw, (60, 130, 310, 170), radius=8, fill="#2563eb", outline="#3b82f6", width=2)
    draw.text((80, 140), "User Collection", fill="#ffffff", font=header_font)
    user_fields = [
        "• _id: ObjectId (PK)",
        "• email: String (Unique)",
        "• username: String",
        "• firebaseUid: String (Index)",
        "• phoneHash: String",
        "• phoneLast4: String",
        "• role: 'user' | 'host'",
        "• wishlist: [ObjectId -> Listing]",
        "• avatar: { url, filename }",
        "• resetPasswordToken: String",
        "• resetPasswordExpires: Date",
        "• timestamps: true"
    ]
    y = 185
    for f in user_fields:
        draw.text((75, y), f, fill="#e2e8f0", font=item_font)
        y += 21

    # Listing Box
    draw_rounded_rect(draw, (430, 130, 750, 520), radius=8, fill="#1e293b", outline="#10b981", width=2)
    draw_rounded_rect(draw, (430, 130, 750, 170), radius=8, fill="#059669", outline="#10b981", width=2)
    draw.text((450, 140), "Listing Collection", fill="#ffffff", font=header_font)
    listing_fields = [
        "• _id: ObjectId (PK)",
        "• title: String",
        "• description: String",
        "• category: Enum (14 categories)",
        "• image / images: [{ url, filename }]",
        "• price: Number",
        "• location: String, country: String",
        "• geometry: { type: 'Point', coordinates } (2dsphere)",
        "• numRooms: Number, guestsPerRoom: Number",
        "• petsAllowed: Boolean, petChargePerNight",
        "• discount: Number (Early bird)",
        "• avgRating: Number, ratingCount: Number",
        "• Owner: ObjectId -> User (FK)",
        "• reviews: [ObjectId -> Review]",
        "• travelCompanion: { places, food }"
    ]
    y = 185
    for f in listing_fields:
        draw.text((445, y), f, fill="#e2e8f0", font=item_font)
        y += 21

    # Booking Box
    draw_rounded_rect(draw, (850, 130, 1140, 540), radius=8, fill="#1e293b", outline="#f59e0b", width=2)
    draw_rounded_rect(draw, (850, 130, 1140, 170), radius=8, fill="#d97706", outline="#f59e0b", width=2)
    draw.text((870, 140), "Booking Collection", fill="#ffffff", font=header_font)
    booking_fields = [
        "• _id: ObjectId (PK)",
        "• listing: ObjectId -> Listing (FK)",
        "• user: ObjectId -> User (FK)",
        "• startDate: Date, endDate: Date",
        "• nights: Number, numRooms: Number",
        "• guests: { adults, children, animals }",
        "• pricePerNight: Number",
        "• subtotal: Number, gst: Number",
        "• totalPrice: Number",
        "• discountApplied: Boolean, discountAmount",
        "• payment: { razorpayOrderId, status }",
        "• status: 'pending'|'confirmed'|'completed'",
        "• travelCompanion: { weather, plan, budget }",
        "• timestamps: true"
    ]
    y = 185
    for f in booking_fields:
        draw.text((865, y), f, fill="#e2e8f0", font=item_font)
        y += 21

    # Review Box
    draw_rounded_rect(draw, (430, 580, 750, 710), radius=8, fill="#1e293b", outline="#ec4899", width=2)
    draw_rounded_rect(draw, (430, 580, 750, 615), radius=8, fill="#db2777", outline="#ec4899", width=2)
    draw.text((450, 590), "Review Collection", fill="#ffffff", font=header_font)
    review_fields = [
        "• _id: ObjectId (PK)",
        "• comment: String",
        "• rating: Number (1 - 5)",
        "• author: ObjectId -> User (FK)",
        "• createdAt: Date"
    ]
    y = 625
    for f in review_fields:
        draw.text((445, y), f, fill="#e2e8f0", font=item_font)
        y += 18

    # Relationship Lines
    # User -> Listing (1 to N)
    draw_arrow(draw, (310, 240), (430, 240), color="#38bdf8", width=2)
    draw.text((325, 220), "1 : N (Owner)", fill="#38bdf8", font=get_font(10))

    # User -> Booking (1 to N)
    draw_arrow(draw, (200, 450), (200, 550), color="#38bdf8", width=2)
    draw_arrow(draw, (200, 550), (850, 550), color="#38bdf8", width=2)
    draw.text((220, 530), "1 : N (Guest)", fill="#38bdf8", font=get_font(10))

    # Listing -> Booking (1 to N)
    draw_arrow(draw, (750, 260), (850, 260), color="#10b981", width=2)
    draw.text((765, 240), "1 : N", fill="#10b981", font=get_font(10))

    # Listing -> Review (1 to N)
    draw_arrow(draw, (590, 520), (590, 580), color="#ec4899", width=2)
    draw.text((605, 540), "1 : N", fill="#ec4899", font=get_font(10))

    # User -> Review (1 to N)
    draw_arrow(draw, (180, 450), (180, 650), color="#818cf8", width=2)
    draw_arrow(draw, (180, 650), (430, 650), color="#818cf8", width=2)
    draw.text((210, 630), "1 : N (Author)", fill="#818cf8", font=get_font(10))

    img.save(output_path, "PNG")
    print(f"Saved: {output_path}")

def generate_flow_diagram(title, steps, output_path, subtitle="Application Workflow Process"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    width, height = 900, 110 + len(steps) * 85
    img = Image.new("RGB", (width, height), "#0f172a")
    draw = ImageDraw.Draw(img)

    title_font = get_font(20, bold=True)
    subtitle_font = get_font(12)
    step_num_font = get_font(13, bold=True)
    step_title_font = get_font(14, bold=True)
    step_desc_font = get_font(11)

    draw.text((50, 30), title, fill="#f8fafc", font=title_font)
    draw.text((50, 60), subtitle, fill="#94a3b8", font=subtitle_font)

    y = 100
    for i, step in enumerate(steps):
        name, desc, color = step
        # Step Circle
        draw.ellipse([50, y, 90, y + 40], fill=color)
        draw.text((64, y + 10), str(i + 1), fill="#ffffff", font=step_num_font)

        # Content Box
        draw_rounded_rect(draw, (110, y, 840, y + 55), radius=8, fill="#1e293b", outline=color, width=2)
        draw.text((130, y + 8), name, fill="#f8fafc", font=step_title_font)
        draw.text((130, y + 30), desc, fill="#94a3b8", font=step_desc_font)

        if i < len(steps) - 1:
            draw_arrow(draw, (70, y + 40), (70, y + 80), color="#64748b", width=2)

        y += 85

    img.save(output_path, "PNG")
    print(f"Saved: {output_path}")

if __name__ == "__main__":
    base_dir = r"c:\Users\hagep\Backend\Grandel"
    
    # 1. Architecture
    generate_system_architecture(os.path.join(base_dir, "docs", "architecture", "system-architecture.png"))
    
    # 2. Database ERD
    generate_er_diagram(os.path.join(base_dir, "docs", "database", "er-diagram.png"))
    
    # 3. Workflows
    # Booking Flow
    booking_steps = [
        ("Discover Property", "Search by location/coordinates, filter by category or amenities on Leaflet map", "#3b82f6"),
        ("Select Dates & Guests", "Choose check-in/out range and input count for adults, children, infants, and pets", "#6366f1"),
        ("Availability & Pricing Engine", "System checks calendar overlaps, computes extra guest fees, pet charges, and 18% GST", "#8b5cf6"),
        ("Initiate Token Reservation", "POST /listings/:id/book/initiate creates a 20% deposit order via Razorpay API", "#ec4899"),
        ("Client Payment Checkout", "Guest confirms token deposit via Razorpay popup with credit card, UPI, or net banking", "#f43f5e"),
        ("Signature Verification & Record Creation", "Server checks HMAC-SHA256 signature, saves booking in DB, and generates travel companion", "#10b981"),
        ("Instant PDF Invoice & Notifications", "Generate bwip-js QR invoice and trigger n8n guest and host webhook notifications", "#06b6d4"),
    ]
    generate_flow_diagram("Grandel - Booking Lifecycle Workflow", booking_steps, os.path.join(base_dir, "docs", "workflows", "booking-flow.png"))

    # Payment Flow
    payment_steps = [
        ("Client Triggers Payment", "Guest clicks Reserve on the booking screen; frontend sends booking parameters", "#3b82f6"),
        ("Server Calculates Pricing", "Backend validates rates, computes 20% token amount in paise, and creates Razorpay Order", "#6366f1"),
        ("Razorpay Modal Opens", "Vite client initializes Razorpay SDK with order_id and key_id", "#8b5cf6"),
        ("Payment Processing", "Customer completes transaction; Razorpay returns order_id, payment_id, and signature", "#f59e0b"),
        ("HMAC-SHA256 Cryptographic Verification", "Backend computes crypto.createHmac and checks match with razorpay_signature", "#10b981"),
        ("Booking Status Set to Paid", "Payment details stored with amount paid; 80% balance due recorded for hotel check-in", "#06b6d4"),
    ]
    generate_flow_diagram("Grandel - Payment & Cryptographic Verification Flow", payment_steps, os.path.join(base_dir, "docs", "workflows", "payment-flow.png"))

    # QR Verification Flow
    qr_steps = [
        ("Generate PDF with Embedded QR", "Server uses bwip-js to render QR barcode containing bookingId into PDFKit invoice", "#3b82f6"),
        ("Guest Presents QR Code", "Guest displays downloaded PDF on mobile device or printout at hotel reception", "#6366f1"),
        ("Host Opens QR Scanner", "Host navigates to /profile/host/scanner and grants browser camera permissions", "#8b5cf6"),
        ("Camera Decodes Booking ID", "html5-qrcode library captures live feed and extracts booking ObjectId", "#f59e0b"),
        ("Authorization Check", "Backend verifies that the scanning user is the authenticated Owner of the listing", "#10b981"),
        ("Financial Settlement & Access", "Scanner shows guest identity, verified dates, 20% paid token, and 80% balance due", "#06b6d4"),
    ]
    generate_flow_diagram("Grandel - QR Check-in Verification Flow", qr_steps, os.path.join(base_dir, "docs", "workflows", "qr-verification-flow.png"))

    # User Registration Flow
    reg_steps = [
        ("User Inputs Details", "User submits Email/Password or clicks Continue with Google on Signup page", "#3b82f6"),
        ("Firebase Authentication", "Firebase Client SDK validates identity and returns cryptographic ID Token (JWT)", "#6366f1"),
        ("Backend Token Verification", "Express server verifies ID token using Firebase Admin SDK and decodes UID", "#8b5cf6"),
        ("MongoDB Record Creation", "User record created or linked; phone is hashed using bcrypt; role set to 'user'", "#10b981"),
        ("Session Cookie Issuance", "Passport req.login serializes session; connect-mongo persists session in Atlas", "#06b6d4"),
    ]
    generate_flow_diagram("Grandel - User Registration & Social Auth Flow", reg_steps, os.path.join(base_dir, "docs", "workflows", "user-registration.png"))

    # Property Management Flow
    prop_steps = [
        ("Host Fills Listing Form", "Host inputs title, category, pricing, rooms, guest capacity, and pet rules", "#3b82f6"),
        ("Cloudinary Image Upload", "Multer multipart pipeline uploads main and gallery images to Cloudinary CDN", "#6366f1"),
        ("Geocoding & Coordinates", "Location string converted to GeoJSON Point coordinates [lng, lat]", "#8b5cf6"),
        ("MongoDB 2dsphere Indexing", "Listing saved with spatial geometry index for fast geospatial radius queries", "#10b981"),
        ("Host Dashboard Management", "Property appears on host dashboard with analytics, booking lists, and edit tools", "#06b6d4"),
    ]
    generate_flow_diagram("Grandel - Property Management Flow", prop_steps, os.path.join(base_dir, "docs", "workflows", "property-management.png"))
