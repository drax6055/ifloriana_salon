const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Payment = require("../models/Payment");
const Service = require("../models/Service");
const Staff = require("../models/Staff");

// GET /api/reports/revenue-summary
router.get("/revenue-summary", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const payments = await Payment.aggregate([
      {
        $match: { salon_id },
      },
      {
        $group: {
          _id: null,
          total_service_amount: { $sum: "$service_amount" },
          total_product_amount: { $sum: "$product_amount" },
          total_discount: { $sum: "$total_discount" },
          total_tax: { $sum: "$tax_amount" },
          total_tips: { $sum: "$tips" },
          total_revenue: { $sum: "$final_total" },
        },
      },
    ]);

    res.json(payments[0] || {});
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch revenue summary", error });
  }
});

// GET /api/reports/revenue-by-date?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get("/revenue-by-date", async (req, res) => {
  const { start, end, salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  try {
    const payments = await Payment.aggregate([
      {
        $match: {
          salon_id,
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          service_amount: { $sum: "$service_amount" },
          product_amount: { $sum: "$product_amount" },
          tax: { $sum: "$tax_amount" },
          tips: { $sum: "$tips" },
          total_discount: { $sum: "$total_discount" },
          final_total: { $sum: "$final_total" },
        },
      },
    ]);

    res.json(payments[0] || {});
  } catch (error) {
    res.status(500).json({ message: "Error fetching date range revenue", error });
  }
});

// GET /api/reports/daily-revenue
router.get("/daily-revenue", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const revenue = await Payment.aggregate([
      {
        $match: { salon_id },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          total: { $sum: "$final_total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(revenue);
  } catch (error) {
    res.status(500).json({ message: "Error fetching daily revenue", error });
  }
});

// GET /api/reports/top-products
router.get("/top-products", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const result = await Appointment.aggregate([
      { $match: { salon_id } },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product_id",
          total_quantity: { $sum: "$products.quantity" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching top products", error });
  }
});

// GET /api/reports/top-services
router.get("/top-services", async (req, res) => {
  try {
    const result = await Appointment.aggregate([
      { $unwind: "$services" },
      {
        $group: {
          _id: "$services.service_id",
          usage_count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "_id",
          foreignField: "_id",
          as: "service",
        },
      },
      { $unwind: "$service" },
      {
        $project: {
          service_name: "$service.service_name",
          usage_count: 1,
        },
      },
      { $sort: { usage_count: -1 } },
      { $limit: 10 },
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch service usage report", error });
  }
});

// GET /api/reports/payment-modes
router.get("/payment-modes", async (req, res) => {
  try {
    const summary = await Payment.aggregate([
      {
        $group: {
          _id: "$payment_method",
          total: { $sum: "$final_total" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment method stats", error });
  }
});

module.exports = router;