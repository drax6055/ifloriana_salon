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
          from: "commissions",
          localField: "commission_id",
          foreignField: "_id",
          as: "commissions",
        },
      },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "staff_id",
          as: "tips",
        },
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
          commission_earn: {
            $sum: {
              $map: {
                input: "$commissions",
                as: "commission",
                in: {
                  $add: [
                    {
                      $sum: {
                        $map: {
                          input: "$$commission.revenue_commission",
                          as: "revenue",
                          in: { $ifNull: ["$$revenue.amount", 0] },
                        },
                      },
                    },
                    {
                      $sum: {
                        $map: {
                          input: "$$commission.service_commission",
                          as: "service",
                          in: { $ifNull: ["$$service.amount", 0] },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          tips_earn: { $sum: "$tips.tips" },
          services: { $size: "$services_provided" },
        },
      },
      {
        $addFields: {
          total_earning: {
            $add: [
              { $ifNull: ["$salary", 0] },
              { $ifNull: ["$tips_earn", 0] },
              { $ifNull: ["$commission_earn", 0] },
            ],
          },
        },
      },
      {
        $project: {
          staff_id: "$_id",
          staff_name: "$full_name",
          staff_image: "$image",
          staff_email: "$email",
          services: 1,
          total_amount: "$salary",
          commission_earn: 1,
          tips_earn: 1,
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
