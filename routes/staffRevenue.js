const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Service = require("../models/Service");
const Staff = require("../models/Staff"); // Optional

// GET /api/staff-revenue
router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: "completed" }).select("services");

    const staffRevenueMap = {}; 

    for (const appt of appointments) {
      if (Array.isArray(appt.services)) {
        for (const item of appt.services) {
          const { staff_id, service_amount } = item;
          if (!staff_id || typeof service_amount !== "number") continue;

          const staffIdStr = staff_id.toString();
          staffRevenueMap[staffIdStr] = (staffRevenueMap[staffIdStr] || 0) + service_amount;
        }
      }
    }

    // Optional: Attach staff names
    const staffIds = Object.keys(staffRevenueMap);
    const staffDetails = await Staff.find({ _id: { $in: staffIds } }).lean();

    const result = staffDetails.map(staff => ({
      staff_id: staff._id,
      name: staff.name,
      revenue: staffRevenueMap[staff._id.toString()] || 0,
    }));

    const resultWithFallback = result.length
      ? result
      : staffIds.map(id => ({ staff_id: id, revenue: staffRevenueMap[id] }));

    res.json({ staffRevenue: resultWithFallback });
  } catch (error) {
    console.error("Error calculating staff revenue:", error);
    res.status(500).json({ message: "Error calculating staff revenue", error });
  }
});


module.exports = router;