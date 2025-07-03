const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const StaffEarning = require("../models/StaffEarning");
const Appointment = require("../models/Appointment");
const Staff = require("../models/Staff");
const Payment = require("../models/Payment");
const RevenueCommission = require("../models/RevenueCommission");
const StaffPayment = require("../models/StaffPayment");
const Salon = require("../models/Salon");
 
// GET /staff-earning
router.get("/", async (req, res) => {
  try {
    const { salon_id } = req.query;
    const allStaff = await Staff.find({ salon_id });
    const earningsList = [];

    for (const staff of allStaff) {
      const staff_id = staff._id;
      const branch_id = staff.branch_id;
      const staff_image = staff.image;

      // Find all completed appointments for this staff
      const appointments = await Appointment.find({
        status: "check-out",
        salon_id,
        "services.staff_id": staff_id
      });

      // Count of appointments where this staff has at least one service
      const total_booking = appointments.length;

      // Total of all services completed by this staff
      let service_amount = 0;
      appointments.forEach((apt) => {
        apt.services.forEach((srv) => {
          if (srv.staff_id.toString() === staff_id.toString()) {
            service_amount += srv.service_amount || 0;
          }
        });
      });


      // Calculate tips received by this staff (divide equally among staff in each appointment)
      let tip_earning = 0;
      const appointmentIds = appointments.map((apt) => apt._id);
      const payments = await Payment.find({ appointment_id: { $in: appointmentIds } }).lean();
      for (const pay of payments) {
        if (pay.tips && pay.appointment_id) {
          const apt = appointments.find(a => a._id.toString() === pay.appointment_id.toString());
          if (apt && Array.isArray(apt.services)) {
            // Get unique staff for this appointment
            const staffSet = new Set();
            for (const svc of apt.services) {
              if (svc.staff_id) staffSet.add(svc.staff_id.toString());
            }
            if (staffSet.has(staff_id.toString())) {
              const tipPerStaff = pay.tips / staffSet.size;
              tip_earning += tipPerStaff;
            }
          }
        }
      }

      let commission_earning = 0;
      const revComm = await RevenueCommission.findOne({ branch_id });

      if (staff.assigned_commission_id && revComm?.commission?.length) {
        const assignedCommission = revComm.commission.find(
          (c) => c._id.toString() === staff.assigned_commission_id.toString()
        );

        if (assignedCommission) {
          if (revComm.commission_type === "Fixed") {
            commission_earning = assignedCommission.amount;
          } else if (revComm.commission_type === "Percentage") {
            commission_earning = (service_amount * assignedCommission.amount) / 100;
          }
        }
      }

      const staff_earning = commission_earning + tip_earning;

      await StaffEarning.findOneAndUpdate(
        { staff_id },
        {
          staff_id,
          salon_id, // Include salon_id in the update
          total_booking,
          service_amount,
          commission_earning,
          tip_earning,
          staff_earning,
        },
        { upsert: true, new: true }
      );

      earningsList.push({
        staff_id: staff_id.toString(),
        staff_name: staff.full_name,
        staff_image: staff_image || null,
        total_booking,
        service_amount,
        commission_earning,
        tip_earning,
        staff_earning,
      });
    }

    return res.status(200).json(earningsList);
  } catch (error) {
    console.error("Error saving staff earnings:", error);
    return res.status(500).json({ message: "Error saving staff earnings", error });
  }
});

// GET /staff-earning/:id
router.get("/:id", async (req, res) => {
  try {
    const { id: staff_id } = req.params;
    const { salon_id } = req.query;

    // Log request parameters and body for debugging
    console.log("Request Params:", req.params);
    console.log("Request Body:", req.body);

    // Validate staff_id
    if (!staff_id || !mongoose.Types.ObjectId.isValid(staff_id)) {
      return res.status(400).json({ message: "Invalid or missing staff ID" });
    }

    const staff = await Staff.findOne({ _id: staff_id, salon_id });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const branch_id = staff.branch_id;

    const appointments = await Appointment.find({
      status: "check-out",
      salon_id,
      "services": {
        $elemMatch: {
          staff_id: staff_id,
          $or: [{ paid: false }, { paid: { $exists: false } }],
        },
      },
    });

    let total_booking = 0;
    let service_amount = 0;

    appointments.forEach((apt) => {
      apt.services.forEach((srv) => {
        if (srv.staff_id.toString() === staff_id && !srv.paid) {
          total_booking += 1;
          service_amount += srv.service_amount || 0;
        }
      });
    });

    const appointmentIds = appointments.map((apt) => apt._id);

    const tipsData = await Payment.aggregate([
      { $match: { appointment_id: { $in: appointmentIds } } },
      { $group: { _id: null, totalTips: { $sum: "$tips" } } },
    ]);
    const tip_earning = tipsData[0]?.totalTips || 0;

    let commission_earning = 0;
    const revComm = await RevenueCommission.findOne({ branch_id });

    if (staff.assigned_commission_id && revComm?.commission?.length) {
      const assignedCommission = revComm.commission.find(
        (c) => c._id.toString() === staff.assigned_commission_id.toString()
      );

      if (assignedCommission) {
        if (revComm.commission_type === "Fixed") {
          commission_earning = assignedCommission.amount;
        } else if (revComm.commission_type === "Percentage") {
          commission_earning = (service_amount * assignedCommission.amount) / 100;
        }
      }
    }

    const staff_earning = commission_earning + tip_earning;

    return res.status(200).json({
      staff_id,
      staff_name: staff.full_name,
      total_booking,
      service_amount,
      commission_earning,
      tip_earning,
      staff_earning,
    });
  } catch (error) {
    console.error("Error calculating staff earnings:", error);
    return res.status(500).json({ message: "Error calculating earnings", error });
  }
});

// POST /pay/:staff_id
router.post("/pay/:staff_id", async (req, res) => {
  try {
    const { staff_id } = req.params;

    if (!staff_id || !mongoose.Types.ObjectId.isValid(staff_id)) {
      return res.status(400).json({ message: "Invalid or missing staff ID" });
    }

    const { salon_id, payment_method, description } = req.body;

    if (!salon_id) {
      return res.status(400).json({ message: "Salon ID is required" });
    }

    const staff = await Staff.findOne({ _id: staff_id, salon_id });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    if (!payment_method) {
      return res.status(400).json({ message: "Payment method is required" });
    }

    const earning = await StaffEarning.findOne({ staff_id });
    if (!earning) {
      return res.status(404).json({ message: "Staff earning not found" });
    }

    const total_paid = earning.staff_earning;
    const tips_to_pay = earning.tip_earning || 0;
    const commission_to_pay = earning.commission_earning || 0;

    // Normalize payment_method to lowercase
    const normalizedPaymentMethod = payment_method.toLowerCase();

    const payment = new StaffPayment({
      staff_id,
      salon_id,
      total_paid,
      payment_method: normalizedPaymentMethod,
      description,
      tips: tips_to_pay,
      commission_amount: commission_to_pay,
    });

    await payment.save();

    // ✅ Mark appointments' services as paid
    await Appointment.updateMany(
      {
        status: "check-out",
        "services.staff_id": staff_id,
      },
      {
        $set: { "services.$[elem].paid": true },
      },
      {
        arrayFilters: [{ "elem.staff_id": new mongoose.Types.ObjectId(staff_id) }],
      }
    );

    // ✅ Reset earnings after payment
    earning.paid_amount = total_paid;
    earning.payment_method = normalizedPaymentMethod;
    earning.staff_earning = 0;
    earning.commission_earning = 0;
    earning.tip_earning = 0;
    earning.total_booking = 0;
    earning.salon_id = salon_id;
    await earning.save();

    // Log for verification
    console.log("Staff Paid: ", {
      staff_id,
      total_paid,
      tips_to_pay,
      commission_to_pay,
    });

    // ✅ Recalculate total_booking after marking services paid
    const remainingAppointments = await Appointment.find({
      status: "check-out",
      "services": {
        $elemMatch: {
          staff_id: staff_id,
          $or: [{ paid: false }, { paid: { $exists: false } }],
        },
      },
    });
    earning.total_booking = remainingAppointments.length;

    res.status(201).json({ message: "Payment processed successfully", data: payment });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ message: "Server error", error });
  }
});


// DELETE /staff-earning/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { salon_id } = req.query;

    const earning = await StaffEarning.findOneAndDelete({ _id: id, salon_id });
    if (!earning) return res.status(404).json({ message: "Staff earning not found" });

    res.status(200).json({ message: "Staff earning deleted successfully" });
  } catch (error) {
    console.error("Error deleting staff earning:", error);
    res.status(500).json({ message: "Error deleting staff earning", error });
  }
});

module.exports = router;