const express = require("express");
const Category = require("../models/Category");
const router = express.Router();

// Create Category with salon_id validation
router.post("/", async (req, res) => {
  const { salon_id, name, image, status } = req.body;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const newCategory = new Category({
      salon_id,
      name,
      image,
      status,
    });
    await newCategory.save();
    res.status(201).json({ message: "Category created successfully", data: newCategory });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get all categories with salon_id filter
router.get("/", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const categories = await Category.find({ salon_id }).populate("salon_id");
    res.status(200).json({ message: "Categories fetched successfully", data: categories });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get Category Names and IDs by Salon ID
router.get("/names", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const categoryNamesAndIds = await Category.find({ salon_id }, { name: 1 });
    res.status(200).json({ message: "Category names and IDs fetched successfully", data: categoryNamesAndIds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Single Category
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id).populate("salon_id");
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ message: "Category fetched successfully", data: category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Category
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(201).json({ message: "Category updated successfully", data: updatedCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Category
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;