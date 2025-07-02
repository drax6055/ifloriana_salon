const express = require("express");
const SubCategory = require("../models/SubCategory");
const Salon = require("../models/Salon"); // Assuming you have a Salon model
const mongoose = require("mongoose");
const router = express.Router();

// Middleware to validate salon_id
const validateSalonId = async (req, res, next) => {
  const salon_id = req.query.salon_id || req.body.salon_id;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(salon_id)) {
    return res.status(400).json({ message: "Invalid salon_id" });
  }

  try {
    const salonExists = await Salon.findById(salon_id);
    if (!salonExists) {
      return res.status(404).json({ message: "Salon not found" });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Apply middleware to all routes
router.use(validateSalonId);

// Create SubCategory
router.post("/", async (req, res) => {
  const { salon_id, image, category_id, name, status } = req.body;

  try {
    const newSubCategory = new SubCategory({
      salon_id: salon_id,
      image: image,
      category_id: category_id,
      name: name,
      status: status,
    });
    await newSubCategory.save();

    res.status(201).json({ message: "SubCategory created successfully", data: newSubCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get All SubCategories with salon_id filter
router.get("/", async (req, res) => {
  const { salon_id } = req.query;

  try {
    const subcategories = await SubCategory.find({ salon_id }).populate("salon_id").populate("category_id");
    res.status(200).json({ message: "SubCategories fetched successfully", data: subcategories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Single SubCategory
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query;

  try {
    const subcategory = await SubCategory.findOne({ _id: id, salon_id }).populate("salon_id").populate("category_id");
    if (!subcategory) {
      return res.status(404).json({ message: "SubCategory not found" });
    }
    res.status(200).json({ message: "SubCategory fetched successfully", data: subcategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update SubCategory
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query; 
  const updateData = req.body;

  try {
    const updatedSubCategory = await SubCategory.findOneAndUpdate({ _id: id, salon_id }, updateData, { new: true });
    if (!updatedSubCategory) {
      return res.status(404).json({ message: "SubCategory not found" });
    }
    res.status(200).json({ message: "SubCategory updated successfully", data: updatedSubCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete SubCategory
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query;

  try {
    const deletedSubCategory = await SubCategory.findOneAndDelete({ _id: id, salon_id });
    if (!deletedSubCategory) {
      return res.status(404).json({ message: "SubCategory not found" });
    }
    res.status(200).json({ message: "SubCategory deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;