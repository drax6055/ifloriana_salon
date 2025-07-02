const express = require("express");
const ProductSubCategory = require("../models/ProductSubCategory");
const Branch = require("../models/Branch");
const ProductCategory = require("../models/ProductCategory");
const Brand = require("../models/Brand");
const router = express.Router();

// Create ProductSubCategory    
router.post("/", async (req, res) => {
  const { branch_id, image, product_category_id, brand_id, name, status, salon_id } = req.body;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    // Validate branch existence
    const branch = await Branch.findOne({ _id: branch_id, salon_id });
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    // Validate product category existence
    const productCategory = await ProductCategory.findOne({ _id: product_category_id, salon_id });
    if (!productCategory) {
      return res.status(404).json({ message: "Product Category not found" });
    }

    // Validate brand existence
    const brand = await Brand.findOne({ _id: brand_id, salon_id });
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const newProductSubCategory = new ProductSubCategory({
      branch_id,
      image,
      product_category_id,
      brand_id,
      name,
      status,
      salon_id,
    });
    await newProductSubCategory.save();

    res.status(201).json({ message: "ProductSubCategory created successfully", data: newProductSubCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get All ProductSubCategories
router.get("/", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const productSubCategories = await ProductSubCategory.find({ salon_id })
      .populate("branch_id")
      .populate("product_category_id")
      .populate("brand_id");
    res.status(200).json({ message: "ProductSubCategories fetched successfully", data: productSubCategories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Single ProductSubCategory
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const productSubCategory = await ProductSubCategory.findOne({ _id: id, salon_id })
      .populate("branch_id")
      .populate("product_category_id")
      .populate("brand_id");
    if (!productSubCategory) {
      return res.status(404).json({ message: "ProductSubCategory not found" });
    }
    res.status(200).json({ message: "ProductSubCategory fetched successfully", data: productSubCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update ProductSubCategory
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id, ...updateData } = req.body;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const updatedProductSubCategory = await ProductSubCategory.findOneAndUpdate({ _id: id, salon_id }, updateData, { new: true });
    if (!updatedProductSubCategory) {
      return res.status(404).json({ message: "ProductSubCategory not found" });
    }
    res.status(200).json({ message: "ProductSubCategory updated successfully", data: updatedProductSubCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete ProductSubCategory
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const deletedProductSubCategory = await ProductSubCategory.findOneAndDelete({ _id: id, salon_id });
    if (!deletedProductSubCategory) {
      return res.status(404).json({ message: "ProductSubCategory not found" });
    }
    res.status(200).json({ message: "ProductSubCategory deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;