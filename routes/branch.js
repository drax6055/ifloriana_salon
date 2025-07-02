const express = require("express");
const Branch = require("../models/Branch");
const router = express.Router();
const Staff = require("../models/Staff");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// Create Branch with salon_id validation
router.post("/", upload.single("image"), async (req, res) => {
  const { salon_id } = req.body;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    let branchData = { ...req.body };
    if (req.file) {
      branchData.image = req.file.path;
    }
    const newBranch = new Branch(branchData);
    await newBranch.save();
    res.status(201).json({ message: "Branch created successfully", data: newBranch });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get All Branches with salon_id filter
router.get("/", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const branches = await Branch.find({ salon_id })
      .populate("salon_id")
      .populate("service_id");

    // Get staff counts grouped by branch_id
    const staffCounts = await Staff.aggregate([
      {
        $group: {
          _id: "$branch_id",
          count: { $sum: 1 },
        },
      },
    ]);

    // Map branchId => count
    const countMap = {};
    staffCounts.forEach(({ _id, count }) => {
      if (_id) {
        countMap[_id.toString()] = count;
      }
    });

    // Attach staff_count to each branch
    const branchData = branches.map((branch) => ({
      ...branch.toObject(),
      staff_count: branch._id ? countMap[branch._id.toString()] || 0 : 0,
    }));

    res.status(200).json({ message: "Branches fetched successfully", data: branchData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Branch Names and IDs by Salon ID
router.get("/names", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const branchNamesAndIds = await Branch.find({ salon_id }, { name: 1 });
    res.status(200).json({ message: "Branch names and IDs fetched successfully", data: branchNamesAndIds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Single Branch
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const branch = await Branch.findById(id)
      .populate("salon_id")
      .populate("service_id");

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    // Count staff members assigned to this branch
    const staffCount = await Staff.countDocuments({ branch_id: id });

    const branchData = {
      ...branch.toObject(),
      staff_count: staffCount,
    };

    res.status(200).json({ message: "Branch fetched successfully", data: branchData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// Update Branch
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    let updateData = { ...req.body };
    if (req.file) {
      updateData.image = req.file.path;
    }
    const updatedBranch = await Branch.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedBranch) return res.status(404).json({ message: "Branch not found" });
    res.json({ message: "Branch updated", data: updatedBranch });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Delete Branch
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedBranch = await Branch.findByIdAndDelete(id);
    if (!deletedBranch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    res.status(200).json({ message: "Branch deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;