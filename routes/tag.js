const express = require("express");
const Tag = require("../models/Tag");
const Branch = require("../models/Branch");
const Salon = require("../models/Salon");
const router = express.Router();

// Middleware to validate salon_id
const validateSalonId = async (req, res, next) => {
  let salonId;
  if (req.method === 'GET' || req.method === 'DELETE') {
    salonId = req.query.salon_id;
  }
  else if (req.method === 'POST' || req.method === 'PUT') {
    salonId = req.body.salon_id;
  }

  if (!salonId) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  const salonExists = await Salon.findById(salonId);
  if (!salonExists) {
    return res.status(404).json({ message: "Salon not found" });
  }
  req.salonId = salonId;
  next();
};

// Apply middleware to all routes
router.use(validateSalonId);

// Create Tag
router.post("/", async (req, res) => {
  const { branch_id, name, status } = req.body;
  const salon_id = req.salonId; // Get salon_id from the validated middleware

  try {
    // 1. Validate branch_id (must be an array and not empty)
    if (!Array.isArray(branch_id) || branch_id.length === 0) {
      return res.status(400).json({ message: "At least one branch_id is required and must be an array." });
    }

    // 2. Validate each branch_id exists and belongs to the given salon_id
    for (const bId of branch_id) {
      const branch = await Branch.findOne({ _id: bId, salon_id });
      if (!branch) {
        return res.status(404).json({ message: `Branch with ID ${bId} not found or does not belong to the specified salon.` });
      }
    }

    // 3. Create the new tag, including salon_id from the request body
    const newTag = new Tag({
      branch_id, 
      name,
      status,
      salon_id, 
    });
    await newTag.save();

    res.status(201).json({ message: "Tag created successfully", data: newTag });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get All Tags
router.get("/", async (req, res) => {
  const salon_id = req.salonId;

  try {
    const tags = await Tag.find({ salon_id }).populate("branch_id");

    res.status(200).json({ message: "Tags fetched successfully", data: tags });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get tag names and IDs by salon_id
router.get("/names", async (req, res) => {
  const { salon_id } = req.query;
  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }
  try {
    const tags = await Tag.find({ salon_id }, { name: 1 }).lean();
    res.status(200).json({ message: "Tag names and IDs fetched successfully", data: tags });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get Single Tag
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const salon_id = req.salonId; // Get salon_id from the validated middleware

  try {
    const tag = await Tag.findOne({ _id: id, salon_id }).populate("branch_id");

    if (!tag) {
      return res.status(404).json({ message: "Tag not found or does not belong to the specified salon" });
    }

    res.status(200).json({ message: "Tag fetched successfully", data: tag });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Tag
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { branch_id, name, status } = req.body;
  const salon_id = req.salonId;

  try {
    // 1. Find the existing tag by _id and salon_id to ensure ownership
    const tag = await Tag.findOne({ _id: id, salon_id });

    if (!tag) {
      return res.status(404).json({ message: "Tag not found or does not belong to the specified salon" });
    }

    // 2. Validate branch_id for update (must be an array and not empty)
    if (!Array.isArray(branch_id) || branch_id.length === 0) {
      return res.status(400).json({ message: "At least one branch_id is required and must be an array." });
    }

    // 3. Validate each incoming branch_id exists and belongs to the given salon_id
    for (const bId of branch_id) {
      const branch = await Branch.findOne({ _id: bId, salon_id });
      if (!branch) {
        return res.status(404).json({ message: `Branch with ID ${bId} not found or does not belong to the specified salon.` });
      }
    }

    // Update the tag fields
    const updatedTag = await Tag.findByIdAndUpdate(
      id,
      { name, branch_id, status },
      { new: true }
    );
    res.status(200).json({ message: "Tag updated successfully", data: updatedTag });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Tag
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const salon_id = req.salonId;

  try {
    const tag = await Tag.findOne({ _id: id, salon_id });

    if (!tag) {
      return res.status(404).json({ message: "Tag not found or does not belong to the specified salon" });
    }

    await Tag.findByIdAndDelete(id);
    res.status(200).json({ message: "Tag deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;