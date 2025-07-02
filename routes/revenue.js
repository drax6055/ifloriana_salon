const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const axios = require('axios'); // Import axios for internal API calls

// Get total revenue
router.get('/', async (req, res) => {
    try {
        // Calculate total revenue from services done
        const totalServicesRevenue = await Appointment.aggregate([
            { $group: { _id: null, total: { $sum: "$sub_total" } } }
        ]);

        res.status(200).json({
            success: true,
            totalRevenue: totalServicesRevenue[0]?.total || 0,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
});

// Added a new route to aggregate data from multiple APIs
router.get('/dashboard', async (req, res) => {
    try {
        const baseUrl = 'http://localhost:5000/api';

        // Make parallel API calls
        const [
            upcomingAppointments,
            serviceBasedCommission,
            revenueBasedCommission,
            productSales,
            orderCount,
            customerCount,
            totalRevenue,
            totalAppointments
        ] = await Promise.all([
            axios.get(`${baseUrl}/appointments/upcoming`),
            axios.get(`${baseUrl}/commissions/service-based`),
            axios.get(`${baseUrl}/commissions/revenue-based`),
            axios.get(`${baseUrl}/orders/total-amount`),
            axios.get(`${baseUrl}/orders/count`),
            axios.get(`${baseUrl}/customers/count`),
            axios.get(`${baseUrl}/revenues`),
            axios.get(`${baseUrl}/appointments/total`)
        ]);

        // Combine results into a single response
        res.status(200).json({
            upcomingAppointments: upcomingAppointments.data,
            serviceBasedCommission: serviceBasedCommission.data,
            revenueBasedCommission: revenueBasedCommission.data,
            productSales: productSales.data,
            orderCount: orderCount.data,
            customerCount: customerCount.data,
            totalRevenue: totalRevenue.data,
            totalAppointments: totalAppointments.data
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Error fetching dashboard data', error });
    }
});

module.exports = router;