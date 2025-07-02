const express = require('express');
const Customer = require('../models/Customer');
const BranchMembership = require('../models/BranchMembership');
const CustomerMembership = require('../models/CustomerMembership');
const upload = require("../utils/upload");
const router = express.Router();

// Customer buys a membership
router.post('/purchase', async (req, res) => {
    const { customer_id, branchMembership_id, salon_id } = req.body;

    if (!salon_id) {
        return res.status(400).json({ message: 'salon_id is required' });
    }

    try {
        // Step 1: Validate customer, membership, and salon existence
        const customer = await Customer.findById(customer_id);
        const membership = await BranchMembership.findById(branchMembership_id);

        if (!customer || !membership) {
            return res.status(404).json({ message: "Customer or Membership not found" });
        }

        // Step 2: Check if the customer already has an active membership of the same plan
        const existing = await CustomerMembership.findOne({
            customer_id,
            branchMembership_id,
            status: 1,
            $or: [
                { end_date: null }, // lifetime memberships
                { end_date: { $gte: new Date() } } // still valid
            ]
        });

        if (existing) {
            return res.status(400).json({ message: 'Customer already has an active membership.' });
        }

        // Step 3: Calculate start and end dates based on the subscription plan
        const startDate = new Date();
        let endDate = null;

        switch (membership.subscription_plan) {
            case '1-month':
                endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + 1);
                break;
            case '3-months':
                endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + 3);
                break;
            case '6-months':
                endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + 6);
                break;
            case '12-months':
                endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + 12);
                break;
            case 'lifetime':
                endDate = null; // lifetime means no expiry
                break;
            default:
                return res.status(400).json({ message: "Invalid subscription plan" });
        }

        // Step 4: Save new membership
        const newCustomerMembership = new CustomerMembership({
            customer_id,
            branchMembership_id,
            salon_id,
            start_date: startDate,
            end_date: endDate,
            status: 1,
        });

        await newCustomerMembership.save();

        res.status(201).json({
            message: 'Membership purchased successfully',
            data: newCustomerMembership,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Create Customer Membership with salon_id validation
router.post('/', async (req, res) => {
    const { salon_id, membership_name, discount, status } = req.body;

    if (!salon_id) {
        return res.status(400).json({ message: 'salon_id is required' });
    }

    try {
        const newMembership = new CustomerMembership({ salon_id, membership_name, discount, status });
        await newMembership.save();
        res.status(201).json({ message: 'Customer Membership created successfully', data: newMembership });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Get all customer memberships with salon_id filter
router.get('/', async (req, res) => {
    const { salon_id } = req.query;

    if (!salon_id) {
        return res.status(400).json({ message: 'salon_id is required' });
    }

    try {
        const memberships = await CustomerMembership.find({ salon_id })
            .populate('customer_id', 'image full_name email phone_number')
            .populate('branchMembership_id', 'membership_name subscription_plan membership_amount');

        res.status(200).json({ message: 'Customer Memberships fetched successfully', data: memberships });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update Customer Membership
router.put('/:id', (req, res) => {
  req.upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Image upload failed', error: err.message });
    }
    try {
      let updateData = { ...req.body };
      if (req.file) {
        updateData.image = req.file.path;
      }
      const updatedMembership = await CustomerMembership.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!updatedMembership) return res.status(404).json({ message: 'Customer membership not found' });
      res.json({ message: 'Customer membership updated', data: updatedMembership });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });
});

// Delete customer membership
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedMembership = await CustomerMembership.findByIdAndDelete(id);

        if (!deletedMembership) {
            return res.status(404).json({ message: 'Customer membership not found' });
        }

        res.status(200).json({ message: 'Customer membership deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer membership:', error);
        res.status(500).json({ message: 'Error deleting customer membership', error });
    }
});

module.exports = router;
