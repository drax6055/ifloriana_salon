const express = require("express");
const Service = require("../models/Service");
const mongoose = require("mongoose");
const router = express.Router();

// Create Service
router.post("/", async (req, res) => {
  const {
    image,
    name,
    service_duration,
    regular_price,
    members_price,
    category_id,
    description,
    status,
    salon_id,
  } = req.body;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(salon_id)) {
    return res.status(400).json({ message: "Invalid salon_id" });
  }

  if (!category_id) {
    return res.status(400).json({ message: "category_id is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(category_id)) {
    return res.status(400).json({ message: "Invalid category_id" });
  }

  try {
    const newService = new Service({
      image,
      name,
      service_duration,
      regular_price,
      members_price,
      category_id,
      description,
      status,
      salon_id,
    });
    await newService.save();

    res.status(201).json({ message: "Service created successfully", data: newService });
  } catch (error) {
    console.error("Error while creating service:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get All Services
router.get("/", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const services = await Service.find({ salon_id })
      .populate("salon_id")
      .populate("category_id");

    res.status(200).json({
      message: "Services fetched successfully",
      data: services,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Get Services with salon_id filter
router.get("/names", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(salon_id)) {
    return res.status(400).json({ message: "Invalid salon_id" });
  }

  try {
    const services = await Service.find({ salon_id });
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch services", error: error.message });
  }
});

// Get Single Service
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const service = await Service.findOne({ _id: id, salon_id });
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.status(200).json({ message: "Service fetched successfully", data: service });
  } catch (error) {
    console.error("Error fetching service:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Update Service
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id, ...updateData } = req.body;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const updatedService = await Service.findOneAndUpdate({ _id: id, salon_id }, updateData, { new: true });
    if (!updatedService) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.status(200).json({ message: "Service updated successfully", data: updatedService });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Delete Service
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const deletedService = await Service.findOneAndDelete({ _id: id, salon_id });
    if (!deletedService) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
