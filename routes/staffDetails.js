const express = require("express");
const Staff = require("../models/Staff");
const mongoose = require("mongoose");
const router = express.Router();

// Fetch Staff Details with Earnings
router.get("/", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const staffDetails = await Staff.aggregate([
      {
        $match: { salon_id: new mongoose.Types.ObjectId(salon_id) },
      },
      {
        $lookup: {
          from: "services",
          localField: "service_id",
          foreignField: "_id",
          as: "services_provided",
        },
      },
      {
        $lookup: {
          from: "revenuecommissions",
          let: { commissionId: { $ifNull: ["$assigned_commission_id", "$commission_id"] } },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$commissionId"] } } }
          ],
          as: "commission_details",
        },
      },
      {
        $lookup: {
          from: "appointments",
          let: { staffId: "$_id" },
          pipeline: [
            { $match: { status: "check-out" } },
            { $unwind: "$services" },
            { $match: { $expr: { $eq: ["$services.staff_id", "$$staffId"] } } },
            { 
              $project: { 
                service_amount: "$services.service_amount", 
                service_id: "$services.service_id" 
              } 
            }
          ],
          as: "provided_services"
        }
      },
      {
        $lookup: {
          from: "payments",
          let: { staffId: "$_id" },
          pipeline: [
            { 
              $lookup: {
                from: "appointments",
                localField: "appointment_id",
                foreignField: "_id",
                as: "appointment"
              }
            },
            { $unwind: "$appointment" },
            { $unwind: "$appointment.services" },
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $eq: ["$appointment.services.staff_id", "$$staffId"] },
                    { $gt: ["$tips", 0] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                total_tips: { $sum: "$tips" }
              }
            }
          ],
          as: "staff_tips"
        }
      },
      {
        $lookup: {
          from: "staffpayouts",
          localField: "_id",
          foreignField: "staff_id",
          as: "payouts",
        },
      },
      {
        $addFields: {
          commission: {
            $sum: {
              $map: {
                input: "$provided_services",
                as: "service",
                in: {
                  $let: {
                    vars: {
                      matchingSlot: {
                        $first: {
                          $filter: {
                            input: { $ifNull: [{ $arrayElemAt: ["$commission_details.commission", 0] }, []] },
                            as: "slot",
                            cond: {
                              $and: [
                                { $lte: [{ $toDouble: { $arrayElemAt: [{ $split: ["$$slot.slot", "-"] }, 0] } }, "$$service.service_amount"] },
                                { $gte: [{ $toDouble: { $arrayElemAt: [{ $split: ["$$slot.slot", "-"] }, 1] } }, "$$service.service_amount"] }
                              ]
                            }
                          }
                        }
                      }
                    },
                    in: {
                      $cond: [
                        { $eq: [{ $arrayElemAt: ["$commission_details.commission_type", 0] }, "Percentage"] },
                        { $divide: [{ $multiply: ["$$service.service_amount", "$$matchingSlot.amount"] }, 100] },
                        "$$matchingSlot.amount"
                      ]
                    }
                  }
                }
              }
            }
          },
          tips: { $ifNull: [{ $arrayElemAt: ["$staff_tips.total_tips", 0] }, 0] },
          service_count: { $size: "$provided_services" }
        },
      },
      {
        $addFields: {
          total_earning: { $add: ["$commission", "$tips"] },
        },
      },
      {
        $project: {
          _id: 1,
          staff_id: "$_id",
          staff_name: "$full_name",
          staff_image: "$image",
          staff_email: "$email",
          service_count: 1,
          commission: 1,
          tips: 1,
          total_earning: 1,
        },
      },
    ]);

    res.status(200).json({ message: "Staff details fetched successfully", data: staffDetails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;