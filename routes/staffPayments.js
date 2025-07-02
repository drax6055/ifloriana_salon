const express = require("express");
const router = express.Router();
const StaffPayment = require("../models/StaffPayment");
const Staff = require("../models/Staff");
const StaffEarning = require("../models/StaffEarning"); // Assuming StaffEarning model is required
const Salon = require("../models/Salon"); // Assuming Salon model is required
const mongoose = require("mongoose"); // Ensure mongoose is imported

// GET request to fetch payment details
router.get("/", async (req, res) => {
  try {
    const { salon_id } = req.query;

    if (!salon_id) {
      return res.status(400).json({ message: "Salon ID is required" });
    }

    const salonExists = await Salon.findById(salon_id);
    if (!salonExists) {
      return res.status(404).json({ message: "Salon not found" });
    }

    const payments = await StaffPayment.find({ salon_id })
      .populate({
        path: "staff_id",
        select: "full_name email phone_number image", // Correct field names
      })
      .select("paid_at staff_id total_paid payment_method tips commission_amount");

    // Fetch staff earnings for all staff in this salon
    const staffEarnings = await StaffEarning.find({ salon_id }).lean();
    // Map by staff_id as string for quick lookup
    const earningsMap = {};
    for (const earning of staffEarnings) {
      // Use _id if present, else staff_id
      const key = (earning.staff_id && earning.staff_id.toString()) || (earning._id && earning._id.toString());
      if (key) earningsMap[key] = earning;
    }

    const formattedPayments = payments
      .filter(payment => payment.staff_id)
      .map((payment) => {
        return {
          payment_date: payment.paid_at,
          staff: {
            name: payment.staff_id.full_name || "N/A",
            email: payment.staff_id.email || "N/A",
            phone: payment.staff_id.phone_number || "N/A",
            image: payment.staff_id.image || null,
          },
          commission_amount: payment.commission_amount || 0,
          tips: payment.tips || 0,
          payment_type: payment.payment_method,
          total_pay: payment.total_paid,
          staff_id: payment.staff_id._id ? payment.staff_id._id.toString() : null,
        };
      });

    // Filter staff whose payment has been done
    const staffWithPayments = formattedPayments.filter((payment) => payment.total_pay > 0);

    // Remove staff from staff earning after payment
    for (const payment of staffWithPayments) {
      await StaffEarning.updateOne(
        { staff_id: new mongoose.Types.ObjectId(payment.staff_id), salon_id }, // Correct ObjectId instantiation
        { $set: { total_booking: 0, staff_earning: 0, commission_earning: 0, tip_earning: 0 } }
      );
    }

    res.status(200).json({ success: true, data: staffWithPayments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch payments", error: error.message });
  }
});

module.exports = router;