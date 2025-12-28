const PDFDocument = require("pdfkit");

module.exports.generateBookingPDF = ({
  res,
  bookingId,
  user,
  owner,
  listing,
  booking,
}) => {
  const doc = new PDFDocument({ size: "A4", margin: 40 });

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=booking-${bookingId}.pdf`
  );
  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);

  /* ===== BORDER ===== */
  doc.rect(20, 20, 555, 800).lineWidth(1).stroke("#1e4fa1");

  /* ===== HEADER ===== */
  doc
    .fontSize(26)
    .fillColor("#1e4fa1")
    .text(listing.title, { align: "center" });

  doc.moveDown(0.5);

  const ownerEmail = owner ? owner.email : "info@wanderlust.com";

  doc
    .fontSize(10)
    .fillColor("#555")
    .text(
      `${listing.location}, ${listing.country} | ${ownerEmail} | www.wanderlust.com`,
      { align: "center" }
    );

  doc.moveDown();
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke("#cfd8e3");

  /* ===== BOOKING TITLE ===== */
  doc.moveDown();
  doc
    .fontSize(20)
    .fillColor("#1e4fa1")
    .text("BOOKING", 420, doc.y - 10);

  /* ===== DETAILS ===== */
  let y = doc.y + 20;
  doc.fontSize(11).fillColor("#000");

  doc.text("Booking Details", 40, y, { underline: true });
  y += 18;
  doc.text(`Check-in: ${booking.startDate.toDateString()}`, 40, y);
  y += 15;
  doc.text(`Check-out: ${booking.endDate.toDateString()}`, 40, y);
  y += 15;
  doc.text(`Nights: ${booking.nights}`, 40, y);

  doc.text(`Booking #: ${bookingId}`, 350, y - 45);
  doc.text(`Status: Confirmed`, 350, y - 30);

  /* ===== TABLE ===== */
  let tableTop = y + 40;
  doc.rect(40, tableTop, 515, 22).fill("#1e4fa1");

  doc
    .fillColor("#fff")
    .fontSize(11)
    .text("Description", 50, tableTop + 6)
    .text("Unit Price", 300, tableTop + 6)
    .text("Amount", 420, tableTop + 6);

  doc.fillColor("#000");
  let rowY = tableTop + 30;

  doc.text(`${booking.nights} Nights`, 50, rowY);
  doc.text(`₹${listing.price}`, 300, rowY);
  doc.text(`₹${booking.nights * listing.price}`, 420, rowY);

  rowY += 30;
  doc.text(`GST (18%)`, 300, rowY);
  doc.text(`₹${booking.gst}`, 420, rowY);

  rowY += 20;
  doc.fontSize(13).fillColor("#1e4fa1").text(`TOTAL`, 300, rowY);
  doc.text(`₹${booking.totalPrice}`, 420, rowY);

  /* ===== WATERMARK TICK ===== */
  doc
    .fontSize(160)
    .fillColor("rgba(0,180,0,0.08)")
    .rotate(-25, { origin: [300, 400] })
    .text("✓", 180, 350);

  doc.end();
};
