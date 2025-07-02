const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Payment = require("../models/Payment");
const Coupon = require("../models/Coupon");
const Tax = require("../models/Tax");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require("path");

const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

router.post("/", async (req, res) => {
  try {
    const {
      appointment_id,
      payment_method,
      coupon_id,
      tax_id,
      additional_discount = 0,
      tips = 0
    } = req.body;

    // 🧹 Clean empty string ObjectIds
    const cleanCouponId = coupon_id && coupon_id !== "" ? coupon_id : undefined;
    const cleanTaxId = tax_id && tax_id !== "" ? tax_id : undefined;

    const appointment = await Appointment.findById(appointment_id)
      .populate("customer_id")
      .populate("salon_id")
      .populate("branch_id");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const salon_id = appointment.salon_id?._id || appointment.salon_id;
    const branch_id = appointment.branch_id?._id || appointment.branch_id;

    const service_amount = appointment.services?.reduce((sum, s) => sum + (s.service_amount || 0), 0) || 0;
    const product_amount = appointment.products?.reduce((sum, p) => sum + (p.total_price || 0), 0) || 0;
    const sub_total = service_amount + product_amount;

    // 🎟 Coupon discount
    let coupon_discount = 0;
    if (cleanCouponId) {
      const coupon = await Coupon.findById(cleanCouponId);
      if (coupon && coupon.status === 1 && new Date() >= coupon.start_date && new Date() <= coupon.end_date) {
        if (coupon.discount_type === "percent") {
          coupon_discount = Math.round((sub_total * coupon.discount_amount) / 100);
        } else {
          coupon_discount = coupon.discount_amount;
        }
      }
    }

    // 🧾 Tax
    let tax_amount = 0;
    if (cleanTaxId) {
      const tax = await Tax.findById(cleanTaxId);
      if (tax && tax.status === 1) {
        if (tax.type === "percent") {
          tax_amount = Math.round((sub_total * tax.value) / 100);
        } else {
          tax_amount = tax.value;
        }
      }
    }

    const final_total = sub_total - coupon_discount - additional_discount + tax_amount + tips;
    const amount_paid = final_total;

    const payment = new Payment({
      appointment_id,
      salon_id,
      branch_id,
      service_amount,
      product_amount,
      sub_total,
      coupon_id: cleanCouponId,
      coupon_discount,
      additional_discount,
      tips,
      tax_id: cleanTaxId,
      tax_amount,
      payment_method,
      final_total
    });

    await payment.save();
    await Appointment.findByIdAndUpdate(appointment_id, { payment_status: "Paid" });

    // 🧾 Generate PDF Invoice
    const invoiceId = payment._id.toString();
    const doc = new PDFDocument();
    const invoiceFileName = `invoice-${invoiceId}.pdf`;
    const invoicePath = path.join(uploadsDir, invoiceFileName);
    doc.pipe(fs.createWriteStream(invoicePath));

    const customer = appointment.customer_id || {};
    const salon = appointment.salon_id || {};
    const branch = appointment.branch_id || {};

    // 🧾 Invoice Header
    doc.fontSize(22).font("Helvetica-Bold").text(salon.salon_name || "-", { align: "center" });
    doc.fontSize(14).text(branch.name || "-", { align: "center" });
    doc.fontSize(10).font("Helvetica").text(branch.address || salon.address || "-", { align: "center" });
    doc.text(`Phone: ${branch.contact_number || salon.contact_number || "-"}`, { align: "center" });
    doc.text(`Email: ${branch.contact_email || salon.contact_email || "-"}`, { align: "center" });
    doc.moveDown(1);

    doc.fontSize(16).font("Helvetica-Bold").text("Payment Invoice", { align: "center" });
    doc.moveDown(1);

    doc.fontSize(11);
    doc.font("Helvetica-Bold").text(`Invoice ID: `, { continued: true }).font("Helvetica").text(invoiceId);
    doc.font("Helvetica-Bold").text(`Customer: `, { continued: true }).font("Helvetica").text(customer.full_name || "-");
    doc.font("Helvetica-Bold").text(`Phone: `, { continued: true }).font("Helvetica").text(customer.phone_number || "-");
    doc.font("Helvetica-Bold").text(`Date: `, { continued: true }).font("Helvetica").text(new Date().toLocaleString());
    doc.font("Helvetica-Bold").text(`Payment Method: `, { continued: true }).font("Helvetica").text(payment_method || "-");
    doc.moveDown(1);

    // 📊 Summary
    doc.fontSize(12).font("Helvetica-Bold").text("Summary", { underline: true });
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(10)
      .text(`Service Amount: ₹${service_amount.toFixed(2)}`, { align: "right" })
      .text(`Product Amount: ₹${product_amount.toFixed(2)}`, { align: "right" })
      .text(`Coupon Discount: ₹${coupon_discount.toFixed(2)}`, { align: "right" })
      .text(`Additional Discount: ₹${additional_discount.toFixed(2)}`, { align: "right" })
      .text(`Tax Amount: ₹${tax_amount.toFixed(2)}`, { align: "right" })
      .text(`Tips: ₹${tips.toFixed(2)}`, { align: "right" })
      .moveDown(1)
      .font("Helvetica-Bold")
      .text(`Final Total: ₹${final_total.toFixed(2)}`, { align: "right" });
    doc.moveDown(2);

    doc.fontSize(9).font("Helvetica-Oblique").text("Thank you for your payment!", { align: "center" });
    doc.font("Helvetica-Oblique").text("This is a system-generated invoice.", { align: "center" });
    doc.end();

    res.status(201).json({
      message: "Payment recorded and invoice generated",
      payment,
      invoice_pdf_url: `/api/uploads/${invoiceFileName}`
    });

  } catch (error) {
    console.error("Error generating payment invoice:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// ✅ Get all payments by salon
router.get("/", async (req, res) => {
  const { salon_id } = req.query;
  if (!salon_id) return res.status(400).json({ message: "salon_id is required" });

  try {
    const payments = await Payment.find({ salon_id }).populate("salon_id", "name");

    // For each payment, fetch the appointment, count its services, and calculate staff tips
    const data = await Promise.all(payments.map(async (p) => {
      let service_count = 0;
      let staff_tips = [];
      if (p.appointment_id) {
        const appointment = await Appointment.findById(p.appointment_id).select("services").populate("services.staff_id", "full_name email phone_number image");
        if (appointment && Array.isArray(appointment.services)) {
          service_count = appointment.services.length;
          // Get unique staff
          const staffMap = {};
          for (const svc of appointment.services) {
            if (svc.staff_id && svc.staff_id._id) {
              staffMap[svc.staff_id._id.toString()] = svc.staff_id;
            }
          }
          const staffList = Object.values(staffMap);
          // Divide tips equally
          const tipPerStaff = staffList.length > 0 ? (p.tips || 0) / staffList.length : 0;
          staff_tips = staffList.map(staff => ({
            _id: staff._id,
            name: staff.full_name,
            email: staff.email,
            phone: staff.phone_number,
            image: staff.image,
            tip: Number(tipPerStaff.toFixed(2))
          }));
        }
      }
      return {
        ...p.toObject(),
        invoice_pdf_url: `/api/uploads/invoice-${p._id}.pdf`,
        service_count,
        staff_tips
      };
    }));

    res.status(200).json({ message: "Payments fetched successfully", data });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ View specific invoice PDF
router.get("/invoice", async (req, res) => {
  try {
    const { invoice_id } = req.query;
    if (!invoice_id) return res.status(400).json({ message: "invoice_id is required" });

    const fileName = `invoice-${invoice_id}.pdf`;
    const filePath = path.join("uploads", fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Invoice file not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.sendFile(filePath, { root: "./" }, (err) => {
      if (err) {
        console.error("Error sending invoice file:", err);
        res.status(500).json({ message: "Error sending invoice file" });
      }
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
