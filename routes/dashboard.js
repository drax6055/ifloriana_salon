const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const StaffPayment = require('../models/StaffPayment');
const Service = require('../models/Service');
const Order = require("../models/Order");

router.get('/', async (req, res) => {
  const { salon_id, branch_id, startDate, endDate, month, year } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: 'salon_id is required' });
  }

  const salonObjectId = new mongoose.Types.ObjectId(salon_id);
  const branchFilter = branch_id ? { branch_id: new mongoose.Types.ObjectId(branch_id) } : {};

  // Prepare date filters
  let dateMatch = {};
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // include full end day
    dateMatch = { $gte: start, $lte: end };
  }

  const filterMonth = month ? parseInt(month) : null;
  const filterYear = year ? parseInt(year) : null;

  function getDateFilter(dateField) {
    if (dateMatch.$gte) {
      return { [dateField]: dateMatch };
    } else if (filterMonth && filterYear) {
      return {
        $expr: {
          $and: [
            { $eq: [{ $month: `$${dateField}` }, filterMonth] },
            { $eq: [{ $year: `$${dateField}` }, filterYear] }
          ]
        }
      };
    } else if (filterYear) {
      return {
        $expr: {
          $eq: [{ $year: `$${dateField}` }, filterYear]
        }
      };
    } else {
      return {};
    }
  }

  try {
    const [
      appointmentCount,
      customerCount,
      orderCount,
      paymentProductSales,
      orderProductSales,
      totalCommission,
      upcomingAppointments,
      topServices
    ] = await Promise.all([

      Appointment.countDocuments({
        salon_id: salonObjectId,
        ...branchFilter,
        ...getDateFilter('appointment_date')
      }),

      Customer.countDocuments({
        salon_id: salonObjectId,
        ...branchFilter,
        ...getDateFilter('createdAt')
      }),

      Order.countDocuments({
        salon_id: salonObjectId,
        ...branchFilter,
        ...getDateFilter('createdAt')
      }),

      Payment.aggregate([
        {
          $match: {
            salon_id: salonObjectId,
            ...branchFilter,
            ...getDateFilter("createdAt"),
            product_amount: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            totalProductSales: { $sum: "$product_amount" }
          }
        }
      ]),

      Order.aggregate([
        {
          $match: {
            salon_id: salonObjectId,
            ...branchFilter,
            ...getDateFilter("createdAt")
          }
        },
        {
          $group: {
            _id: null,
            totalProductSales: { $sum: "$total_price" }
          }
        }
      ]),

      StaffPayment.aggregate([
        {
          $match: {
            salon_id: salonObjectId,
            ...branchFilter,
            ...getDateFilter('paid_at')
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total_paid" }
          }
        }
      ]),

      Appointment.aggregate([
        {
          $match: {
            salon_id: salonObjectId,
            status: "upcoming",
            ...branchFilter,
            ...getDateFilter('appointment_date')
          }
        },
        {
          $lookup: {
            from: "customers",
            localField: "customer_id",
            foreignField: "_id",
            as: "customer"
          }
        },
        { $unwind: "$customer" },
        { $unwind: "$services" },
        {
          $lookup: {
            from: "services",
            localField: "services.service_id",
            foreignField: "_id",
            as: "service"
          }
        },
        { $unwind: "$service" },
        {
          $project: {
            _id: 0,
            customer_name: "$customer.full_name",
            customer_image: "$customer.image",
            appointment_date: 1,
            appointment_time: 1,
            service_name: "$service.name"
          }
        },
        { $sort: { appointment_date: 1, appointment_time: 1 } },
        { $limit: 5 }
      ]),

      Appointment.aggregate([
        {
          $match: {
            salon_id: salonObjectId,
            ...branchFilter,
            ...getDateFilter('appointment_date')
          }
        },
        { $unwind: "$services" },
        {
          $group: {
            _id: "$services.service_id",
            count: { $sum: 1 },
            totalAmount: { $sum: { $ifNull: ["$services.service_amount", 0] } }
          }
        },
        {
          $lookup: {
            from: "services",
            localField: "_id",
            foreignField: "_id",
            as: "service"
          }
        },
        { $unwind: "$service" },
        {
          $project: {
            _id: 0,
            service_name: "$service.name",
            count: 1,
            totalAmount: {
              $cond: {
                if: { $eq: ["$totalAmount", 0] },
                then: { $multiply: ["$count", { $ifNull: ["$service.regular_price", 0] }] },
                else: "$totalAmount"
              }
            }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    const totalProductSales =
      (paymentProductSales[0]?.totalProductSales || 0) +
      (orderProductSales[0]?.totalProductSales || 0);

    res.status(200).json({
      appointmentCount,
      customerCount,
      orderCount,
      productSales: totalProductSales,
      totalCommission: totalCommission[0]?.total || 0,
      upcomingAppointments,
      topServices
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error });
  }
});

router.get('/dashboard-summary', async (req, res) => {
  try {
    const { salon_id, startDate, endDate, month, year, branch_id } = req.query;

    if (!salon_id) {
      return res.status(400).json({ success: false, message: 'salon_id is required' });
    }

    const salonObjectId = new mongoose.Types.ObjectId(salon_id);
    const branchFilter = branch_id ? { branch_id: new mongoose.Types.ObjectId(branch_id) } : {};

    let matchFilter = {
      salon_id: salonObjectId,
      ...branchFilter
    };

    // ✅ Case 1: startDate & endDate are provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      matchFilter.createdAt = { $gte: start, $lte: endD };

    // ✅ Case 2: month & year provided
    } else if (month && year) {
      const m = parseInt(month) - 1;
      const y = parseInt(year);
      const start = new Date(y, m, 1);
      const endD = new Date(y, m + 1, 0);
      endD.setHours(23, 59, 59, 999);
      matchFilter.createdAt = { $gte: start, $lte: endD };

    // ✅ Case 3: Default to past 7 days
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      matchFilter.createdAt = { $gte: start, $lte: end };
    }

    const result = await Appointment.aggregate([
      {
        $match: matchFilter
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          sales: { $sum: "$total_payment" },
          appointments: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formatted = result.map(item => ({
      date: item._id,
      sales: item.sales,
      appointments: item.appointments
    }));

    res.status(200).json({
      success: true,
      data: {
        lineChart: formatted.map(i => ({ date: i.date, sales: i.sales })),
        barChart: formatted
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;