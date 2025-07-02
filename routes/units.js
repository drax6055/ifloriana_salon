const express = require("express");
const Branch = require("../models/Branch");
const Unit = require("../models/Units");
const Salon = require("../models/Salon");
const router = express.Router();

// Middleware to validate salon_id
const validateSalonId = async (req, res, next) => {
    // For POST and PUT, prioritize salon_id from req.body
    // For GET and DELETE, continue to expect salon_id from req.query
    const salon_id = req.method === 'POST' || req.method === 'PUT' ? req.body.salon_id : req.query.salon_id;

    if (!salon_id) {
        return res.status(400).json({ message: "salon_id is required" });
    }

    try {
        const salonExists = await Salon.findById(salon_id);
        if (!salonExists) {
            return res.status(404).json({ message: "Salon not found" });
        }
        // Attach salon_id to the request object for easy access in subsequent handlers
        req.salon_id = salon_id;
        next();
    } catch (error) {
        console.error("Error in validateSalonId middleware:", error);
        res.status(500).json({ message: "Internal server error during salon validation" });
    }
};

// Apply middleware to all routes
router.use(validateSalonId);

// Create unit
router.post("/", async (req, res) => {
    const { branch_id, name, status } = req.body;
    const salon_id = req.salon_id; // Get salon_id from middleware

    // Basic validation
    if (!name || !branch_id || branch_id.length === 0) {
        return res.status(400).json({ message: "Name and Branch(es) are required." });
    }

    try {
        // Validate if all provided branch_ids exist and belong to the specified salon
        const branches = await Branch.find({ _id: { $in: branch_id }, salon_id });
        if (branches.length !== branch_id.length) {
            return res.status(404).json({ message: "One or more branches not found or do not belong to the specified salon." });
        }

        const newUnit = new Unit({
            branch_id,
            name,
            status,
            salon_id, // Save salon_id to the Unit document
        });
        await newUnit.save();
        res.status(201).json({
            message: "Unit created successfully",
            data: newUnit
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get all units
router.get("/", async (req, res) => {
    const salon_id = req.salon_id; // Get salon_id from middleware

    try {
        const units = await Unit.find({ salon_id }).populate({
            path: "branch_id",
            select: "name" // Only select the name of the branch
        });

        // Filter out units if any of their branches (after population) don't match the salon_id
        // This check is essentially redundant if we already filter by salon_id in the find({ salon_id })
        // but kept for robustness if your data might have inconsistencies.
        const filteredUnits = units.filter(unit =>
            unit.branch_id && unit.branch_id.length > 0
        );

        res.status(200).json({ message: "Units fetched successfully", data: filteredUnits });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get unit names and IDs by salon_id
router.get("/names", async (req, res) => {
    const { salon_id } = req.query;
    if (!salon_id) {
        return res.status(400).json({ message: "salon_id is required" });
    }
    try {
        const units = await Unit.find({ salon_id }, { name: 1 }).lean();
        res.status(200).json({ message: "Unit names and IDs fetched successfully", data: units });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get single unit
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const salon_id = req.salon_id; // Get salon_id from middleware

    try {
        const unit = await Unit.findOne({ _id: id, salon_id }).populate({
            path: "branch_id",
            select: "name" // Only select the name of the branch
        });

        if (!unit) {
            return res.status(404).json({ message: "Unit not found or does not belong to the specified salon." });
        }

        res.status(200).json({ message: "Unit fetched successfully", data: unit });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update unit
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const salon_id = req.salon_id; // Get salon_id from middleware
    const updateData = req.body;

    // Remove salon_id from updateData if it's present, as it shouldn't be changed
    delete updateData.salon_id;

    // Basic validation for name and branch_id if they are being updated
    if (updateData.name !== undefined && !updateData.name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty." });
    }
    if (updateData.branch_id !== undefined && (!Array.isArray(updateData.branch_id) || updateData.branch_id.length === 0)) {
        return res.status(400).json({ message: "Branch(es) cannot be empty." });
    }

    try {
        // Find the unit and ensure it belongs to the current salon
        const unit = await Unit.findOne({ _id: id, salon_id });

        if (!unit) {
            return res.status(404).json({ message: "Unit not found or does not belong to the specified salon." });
        }

        // Validate branch_ids if they are being updated
        if (updateData.branch_id) {
            const branches = await Branch.find({ _id: { $in: updateData.branch_id }, salon_id });
            if (branches.length !== updateData.branch_id.length) {
                return res.status(404).json({ message: "One or more provided branches not found or do not belong to the specified salon." });
            }
        }

        const updatedUnit = await Unit.findByIdAndUpdate(id, updateData, { new: true });
        res.status(200).json({ message: "Unit updated successfully", data: updatedUnit });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Delete unit
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const salon_id = req.salon_id; // Get salon_id from middleware

    try {
        // Find the unit and ensure it belongs to the current salon before deleting
        const unit = await Unit.findOne({ _id: id, salon_id });

        if (!unit) {
            return res.status(404).json({ message: "Unit not found or does not belong to the specified salon." });
        }

        await Unit.findByIdAndDelete(id);
        res.status(200).json({ message: "Unit deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;