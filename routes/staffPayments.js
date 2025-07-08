const express = require("express");
const router = express.Router();
const StaffPayment = require("../models/StaffPayment");
const Staff = require("../models/Staff");
const StaffEarning = require("../models/StaffEarning");
const Salon = require("../models/Salon");
const mongoose = require("mongoose");

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
      .sort({ paid_at: -1, _id: -1 })
      .populate({
        path: "staff_id",
        select: "full_name email phone_number image",
      })
      .select("paid_at staff_id total_paid payment_method tips commission_amount");

    const staffEarnings = await StaffEarning.find({ salon_id }).lean();
    const earningsMap = {};
    for (const earning of staffEarnings) {
      const key = (earning.staff_id && earning.staff_id.toString()) || (earning._id && earning._id.toString());
      if (key) earningsMap[key] = earning;
    }

    const formattedPayments = payments
      .filter(payment => payment.staff_id)
      .map((payment) => {
        const staffIdStr = payment.staff_id._id ? payment.staff_id._id.toString() : null;
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
          staff_id: staffIdStr,
        };
      });

    const staffWithPayments = formattedPayments.filter((payment) => payment.total_pay > 0);

    res.status(200).json({ success: true, data: staffWithPayments });

    // Remove paid staff from StaffEarning collection AFTER sending response
    setImmediate(async () => {
      for (const payment of staffWithPayments) {
        try {
          await StaffEarning.deleteOne({ staff_id: new mongoose.Types.ObjectId(payment.staff_id), salon_id });
        } catch (err) {
          console.error('Error deleting StaffEarning for staff_id', payment.staff_id, err);
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch payments", error: error.message });
  }
});

module.exports = router;
