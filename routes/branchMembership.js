const express = require('express');
const router = express.Router();
const BranchMembership = require('../models/BranchMembership');

// create Branch Membership
router.post('/', async(req, res) => {
    const {
        salon_id, 
        membership_name,
        description,
        subscription_plan,
        status,
        discount,
        discount_type,
        membership_amount, 
    } = req.body;

    if (!salon_id) {
        return res.status(400).json({ message: "salon_id is required" });
    }

    try {
        const newBranchMembership = new BranchMembership({
            salon_id,
            membership_name,
            description,
            subscription_plan,
            status,
            discount, 
            discount_type,
            membership_amount,
        });
        await newBranchMembership.save();
        res.status(201).json({ message: "Salon Membership created successfully", data: newBranchMembership });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// get all branch memberships
router.get('/', async (req, res) => {
    const { salon_id } = req.query;

    if (!salon_id) {
        return res.status(400).json({ message: "salon_id is required" });
    }

    try {
        const branchMembership = await BranchMembership.find({ salon_id }).populate('salon_id');
        res.status(200).json({ message: "Salon membership fetched successfully", data: branchMembership });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Create a route to fetch membership names and IDs
router.get('/names', async (req, res) => {
    try {
        const memberships = await BranchMembership.find({}, 'membership_name _id');
        res.status(200).json({ success: true, data: memberships });
    } catch (error) {
        console.error('Error fetching membership names:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// get single branch membership
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { salon_id } = req.query;

    if (!salon_id) {
        return res.status(400).json({ message: "salon_id is required" });
    }

    try {
        const branchMembership = await BranchMembership.findOne({ _id: id, salon_id }).populate('salon_id');
        if (!branchMembership) {
            return res.status(404).json({ message: "Salon membership not found" });
        }
        res.status(200).json({ message: "Salon membership fetched successfully", data: branchMembership });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


// update branch membership
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { salon_id } = req.body;

    if (!salon_id) {
        return res.status(400).json({ message: "salon_id is required in body for validation" });
    }

    try {
        const updatedBranchMembership = await BranchMembership.findOneAndUpdate(
            { _id: id, salon_id },
            req.body,
            { new: true }
        );
        if (!updatedBranchMembership) {
            return res.status(404).json({ message: "Salon membership not found" });
        }
        res.status(200).json({ message: "Salon membership updated successfully", data: updatedBranchMembership });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


// delete branch membership
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { salon_id } = req.query;

    if (!salon_id) {
        return res.status(400).json({ message: "salon_id is required" });
    }

    try {
        const deletedBranchMembership = await BranchMembership.findOneAndDelete({ _id: id, salon_id });
        if (!deletedBranchMembership) {
            return res.status(404).json({ message: "Salon membership not found!" });
        }
        res.status(200).json({ message: "Salon Membership deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;