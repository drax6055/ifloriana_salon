const express = require("express");
const Variation = require("../models/Variation");
const Salon = require("../models/Salon"); // Assuming you have a Salon model
const Branch = require("../models/Branch"); // Assuming you have a Branch model
const router = express.Router();

// Create Variation
router.post("/", async (req, res) => {
  const { branch_id, name, type, value, status, salon_id } = req.body;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const salonExists = await Salon.findById(salon_id);
    if (!salonExists) {
      return res.status(404).json({ message: "Salon not found" });
    }

    const branch = await Branch.findOne({ _id: branch_id, salon_id });
    if (!branch) {
      return res.status(404).json({ message: "Branch not found or does not belong to the specified salon" });
    }

    const newVariation = new Variation({ branch_id, name, type, value, status, salon_id });
    await newVariation.save();
    res.status(201).json({ message: "Variation created successfully", data: newVariation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get All Variations
router.get("/", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const salonExists = await Salon.findById(salon_id);
    if (!salonExists) {
      return res.status(404).json({ message: "Salon not found" });
    }

    const variations = await Variation.find().populate({
      path: "branch_id",
      match: { salon_id },
    });

    const filteredVariations = variations.filter((variation) => variation.branch_id !== null);

    res.status(200).json({ message: "Variations fetched successfully", data: filteredVariations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all variations (except branch_id) for a salon
router.get("/names", async (req, res) => {
  const { salon_id } = req.query;
  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }
  try {
    const salonExists = await Salon.findById(salon_id);
    if (!salonExists) {
      return res.status(404).json({ message: "Salon not found" });
    }
    // Exclude branch_id from the result
    const variations = await Variation.find({ salon_id }).select("-branch_id").lean();
    res.status(200).json({ message: "Variations fetched successfully", data: variations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Single Variation
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const salonExists = await Salon.findById(salon_id);
    if (!salonExists) {
      return res.status(404).json({ message: "Salon not found" });
    }

    const variation = await Variation.findOne({ _id: id }).populate({
      path: "branch_id",
      match: { salon_id },
    });

    if (!variation || !variation.branch_id) {
      return res.status(404).json({ message: "Variation not found or does not belong to the specified salon" });
    }

    res.status(200).json({ message: "Variation fetched successfully", data: variation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Variation
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.body;
  const updateData = req.body;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const salonExists = await Salon.findById(salon_id);
    if (!salonExists) {
      return res.status(404).json({ message: "Salon not found" });
    }

    const variation = await Variation.findOne({ _id: id }).populate({
      path: "branch_id",
      match: { salon_id },
    });

    if (!variation || !variation.branch_id) {
      return res.status(404).json({ message: "Variation not found or does not belong to the specified salon" });
    }

    const updatedVariation = await Variation.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ message: "Variation updated successfully", data: updatedVariation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Variation
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const salonExists = await Salon.findById(salon_id);
    if (!salonExists) {
      return res.status(404).json({ message: "Salon not found" });
    }

    const variation = await Variation.findOne({ _id: id }).populate({
      path: "branch_id",
      match: { salon_id },
    });

    if (!variation || !variation.branch_id) {
      return res.status(404).json({ message: "Variation not found or does not belong to the specified salon" });
    }

    await Variation.findByIdAndDelete(id);
    res.status(200).json({ message: "Variation deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;