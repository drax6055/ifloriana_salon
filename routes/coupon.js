const express = require("express");
const Coupon = require("../models/Coupon");
const router = express.Router();

// Create Coupon
router.post("/", async (req, res) => {
  const {
    image,
    name,
    branch_id,
    description,
    start_date,
    end_date,
    coupon_type,
    coupon_code,
    discount_type,
    discount_amount,
    use_limit,
    status,
    salon_id,
  } = req.body;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const newCoupon = new Coupon({
      image,
      name,
      branch_id,
      description,
      start_date,
      end_date,
      coupon_type,
      coupon_code,
      discount_type,
      discount_amount,
      use_limit,
      status,
      salon_id,
    });
    await newCoupon.save();

    res.status(201).json({ message: "Coupon created successfully", data: newCoupon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get All Coupons
router.get("/", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const coupons = await Coupon.find({ salon_id }).populate("branch_id");
    res.status(200).json({ message: "Coupons fetched successfully", data: coupons });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Single Coupon
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const coupon = await Coupon.findOne({ _id: id, salon_id }).populate("branch_id");
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.status(200).json({ message: "Coupon fetched successfully", data: coupon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Coupon
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const { salon_id } = req.body;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const updatedCoupon = await Coupon.findOneAndUpdate({ _id: id, salon_id }, updateData, { new: true });
    if (!updatedCoupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.status(200).json({ message: "Coupon updated successfully", data: updatedCoupon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Coupon
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const deletedCoupon = await Coupon.findOneAndDelete({ _id: id, salon_id });
    if (!deletedCoupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;