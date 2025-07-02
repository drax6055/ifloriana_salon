const express = require("express");
const Review = require("../models/Review");
const router = express.Router();

// Create Review
router.post("/", async (req, res) => {
  const { salon_id, branch_id, customer_id, staff_id, message, rating } = req.body;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const newReview = new Review({ salon_id, branch_id, customer_id, staff_id, message, rating });
    await newReview.save();
    res.status(201).json({ message: "Review created successfully", data: newReview });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get All Reviews
router.get("/", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const reviews = await Review.find({ salon_id }).populate("branch_id").populate("customer_id").populate("staff_id");
    res.status(200).json({ message: "Reviews fetched successfully", data: reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Single Review
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const review = await Review.findOne({ _id: id, salon_id });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.status(200).json({ message: "Review fetched successfully", data: review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Review
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id, ...updateData } = req.body;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const updatedReview = await Review.findOneAndUpdate({ _id: id, salon_id }, updateData, { new: true });
    if (!updatedReview) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.status(200).json({ message: "Review updated successfully", data: updatedReview });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Review
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const deletedReview = await Review.findOneAndDelete({ _id: id, salon_id });
    if (!deletedReview) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;