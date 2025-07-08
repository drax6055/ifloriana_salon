const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const StaffEarning = require("../models/StaffEarning");
const Appointment = require("../models/Appointment");
const Staff = require("../models/Staff");
const Payment = require("../models/Payment");
const RevenueCommission = require("../models/RevenueCommission");
const StaffPayment = require("../models/StaffPayment");

// GET /staff-earning
router.get("/", async (req, res) => {
  try {
    const { salon_id } = req.query;
    const allStaff = await Staff.find({ salon_id });
    const earningsList = [];

    for (const staff of allStaff) {
      const staff_id = staff._id;
      const staff_image = staff.image;

      const appointments = await Appointment.find({
        status: "check-out",
        salon_id,
        "services.staff_id": staff_id
      });

      const total_booking = appointments.length;
      let service_amount = 0;
      const serviceEntries = [];

      appointments.forEach((apt) => {
        apt.services.forEach((srv) => {
          if (srv.staff_id.toString() === staff_id.toString()) {
            const amount = Number(srv.service_amount || 0);
            service_amount += amount;
            serviceEntries.push({ service_id: srv.service_id, amount, apt_id: apt._id });
          }
        });
      });

      let tip_earning = 0;
      const appointmentIds = appointments.map((apt) => apt._id);
      const payments = await Payment.find({ appointment_id: { $in: appointmentIds } }).lean();
      for (const pay of payments) {
        if (pay.tips && pay.appointment_id) {
          const apt = appointments.find(a => a._id.toString() === pay.appointment_id.toString());
          if (apt && Array.isArray(apt.services)) {
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
      const commissionId = staff.assigned_commission_id || staff.commission_id;

      if (commissionId) {
        const revComm = await RevenueCommission.findOne({ _id: commissionId });

        if (revComm && Array.isArray(revComm.commission)) {
          for (const entry of serviceEntries) {
            const amount = Number(entry.amount);

            const matchingSlot = revComm.commission.find(slot => {
              const [min, max] = slot.slot.split('-').map(Number);
              return amount >= min && amount <= max;
            });

            if (matchingSlot) {
              const commissionValue = revComm.commission_type === "Percentage"
                ? (amount * matchingSlot.amount) / 100
                : matchingSlot.amount;

              commission_earning += commissionValue;

              await Appointment.updateOne(
                {
                  _id: entry.apt_id,
                  "services.service_id": entry.service_id,
                  "services.staff_id": staff_id
                },
                {
                  $set: {
                    "services.$.commission_earned": commissionValue
                  }
                }
              );
            }
          }

          commission_earning = Math.round(commission_earning * 100) / 100;
        }
      }

      const staff_earning = commission_earning + tip_earning;

      await StaffEarning.findOneAndUpdate(
        { staff_id },
        {
          staff_id,
          salon_id,
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

    if (!staff_id || !mongoose.Types.ObjectId.isValid(staff_id)) {
      return res.status(400).json({ message: "Invalid or missing staff ID" });
    }

    const staff = await Staff.findOne({ _id: staff_id, salon_id });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

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
    const serviceAmounts = [];

    appointments.forEach((apt) => {
      apt.services.forEach((srv) => {
        if (srv.staff_id.toString() === staff_id && !srv.paid) {
          const amount = srv.service_amount || 0;
          total_booking += 1;
          service_amount += amount;
          serviceAmounts.push(amount);
        }
      });
    });

    const appointmentIds = appointments.map((apt) => apt._id);

    const tipsData = await Payment.aggregate([
      { $match: { appointment_id: { $in: appointmentIds } } },
      { $group: { _id: null, totalTips: { $sum: "$tips" } } },
    ]);
    const tip_earning = tipsData[0]?.totalTips || 0;

    // Calculate commission based on service amounts and commission slots
    let commission_earning = 0;
    const commissionId = staff.assigned_commission_id || staff.commission_id;
    if (commissionId) {
      const revComm = await RevenueCommission.findOne({ _id: commissionId });
      if (revComm && revComm.commission?.length) {
        serviceAmounts.forEach(amount => {
          const matchingSlot = revComm.commission.find(slot => {
            const [min, max] = slot.slot.split('-').map(Number);
            return amount >= min && amount <= max;
          });

          if (matchingSlot) {
            if (revComm.commission_type === "Percentage") {
              commission_earning += (amount * matchingSlot.amount) / 100;
            } else {
              commission_earning += matchingSlot.amount;
            }
          }
        });

        // Round to 2 decimal places
        commission_earning = Math.round(commission_earning * 100) / 100;
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
    const { salon_id, payment_method, description } = req.body;

    if (!staff_id || !mongoose.Types.ObjectId.isValid(staff_id)) {
      return res.status(400).json({ message: "Invalid or missing staff ID" });
    }

    if (!salon_id) {
      return res.status(400).json({ message: "Salon ID is required" });
    }

    if (!payment_method) {
      return res.status(400).json({ message: "Payment method is required" });
    }

    const staff = await Staff.findOne({ _id: staff_id, salon_id });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    // ⏱️ Fetch appointments for this staff
    const appointments = await Appointment.find({
      status: "check-out",
      salon_id,
      "services": {
        $elemMatch: {
          staff_id: staff._id,
          $or: [{ paid: false }, { paid: { $exists: false } }]
        }
      }
    });

    let commission_earning = 0;
    let tip_earning = 0;

    const serviceAmounts = [];
    const appointmentIds = [];

    appointments.forEach((apt) => {
      apt.services.forEach((srv) => {
        if (srv.staff_id.toString() === staff_id && !srv.paid) {
          const amount = Number(srv.service_amount || 0);
          serviceAmounts.push(amount);
        }
      });
      appointmentIds.push(apt._id);
    });

    const revComm = await RevenueCommission.findOne({ _id: staff.assigned_commission_id || staff.commission_id });

    if (revComm && revComm.commission?.length) {
      for (const amount of serviceAmounts) {
        const slot = revComm.commission.find((s) => {
          const [min, max] = s.slot.split("-").map(Number);
          return amount >= min && amount <= max;
        });

        if (slot) {
          commission_earning += revComm.commission_type === "Percentage"
            ? (amount * slot.amount) / 100
            : slot.amount;
        }
      }
    }

    const tipData = await Payment.aggregate([
      { $match: { appointment_id: { $in: appointmentIds } } },
      {
        $group: {
          _id: null,
          totalTips: { $sum: "$tips" }
        }
      }
    ]);
    tip_earning = tipData[0]?.totalTips || 0;
    console.log('DEBUG payout:', { staff_id, tipData, tip_earning });

    const staff_earning = commission_earning + tip_earning;

    // ✅ Save the payment now
    const payment = new StaffPayment({
      staff_id,
      salon_id,
      total_paid: staff_earning,
      payment_method: payment_method.toLowerCase(),
      description,
      tips: tip_earning,
      commission_amount: commission_earning,
    });
    await payment.save();

    // ✅ Mark services as paid
    await Appointment.updateMany(
      {
        status: "check-out",
        "services.staff_id": staff_id,
      },
      {
        $set: { "services.$[elem].paid": true }
      },
      {
        arrayFilters: [{ "elem.staff_id": new mongoose.Types.ObjectId(staff_id) }]
      }
    );

    // ✅ Remove StaffEarning for this staff after payout
    await StaffEarning.deleteOne({ staff_id, salon_id });

    res.status(201).json({ message: "Payment processed successfully", data: payment });
  } catch (error) {
    console.error("Error processing staff payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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