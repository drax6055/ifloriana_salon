const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const StaffPayment = require('../models/StaffPayment');
const Service = require('../models/Service');

router.get('/', async (req, res) => {
  const { salon_id, month, year } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: 'salon_id is required' });
  }

  const filterMonth = month ? parseInt(month) : null;
  const filterYear = year ? parseInt(year) : null;

  function getDateFilter(dateField) {
    if (filterMonth && filterYear) {
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
    const salonObjectId = new mongoose.Types.ObjectId(salon_id);

    const [
      appointmentCount,
      customerCount,
      orderCount,
      productSales,
      totalCommission,
      upcomingAppointments,
      topServices
    ] = await Promise.all([

      Appointment.countDocuments({
        salon_id: salonObjectId,
        ...getDateFilter('appointment_date')
      }),

      Customer.countDocuments({
        salon_id: salonObjectId,
        ...getDateFilter('createdAt')
      }),

      Payment.countDocuments({
        salon_id: salonObjectId,
        ...getDateFilter('payment_date')
      }),

      Appointment.aggregate([
        {
          $match: {
            salon_id: salonObjectId,
            ...getDateFilter('appointment_date')
          }
        },
        { $unwind: "$products" },
        {
          $group: {
            _id: null,
            totalProductSales: { $sum: "$products.total_price" }
          }
        }
      ]),

      StaffPayment.aggregate([
        {
          $match: {
            salon_id: salonObjectId,
            ...getDateFilter('paid_date')
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
            ...(filterMonth && filterYear
              ? getDateFilter('appointment_date')
              : filterYear ? getDateFilter('appointment_date') : {})
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

    res.status(200).json({
        appointmentCount,
        customerCount,
        orderCount,
        productSales: productSales[0]?.totalProductSales || 0,
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
    const { salon_id, startDate, endDate } = req.query;

    if (!salon_id) {
      return res.status(400).json({ success: false, message: 'salon_id is required' });
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate ? new Date(endDate) : new Date();

    const result = await Appointment.aggregate([
      {
        $match: {
          salon_id: new mongoose.Types.ObjectId(salon_id),
          createdAt: { $gte: start, $lte: end },
        }
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
        lineChart: formatted.map(i => ({ date: i.date, sales: i.sales })),  // for Line Graph
        barChart: formatted                                                // for Bar Graph
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;