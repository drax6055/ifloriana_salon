const express = require("express");
const Salon = require("../models/Salon");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const router = express.Router();

// Create Salon
router.post("/", upload.single("image"), async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ message: "Invalid or missing request body" });
  }
  const {  ...salonData } = req.body;
   
  try {
    if (req.file) {
      salonData.image = req.file.path;
    }
    const newSalon = new Salon({  ...salonData });
    await newSalon.save();
    res.status(201).json({ message: "Salon created successfully", data: newSalon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get All Salons
router.get("/", async (req, res) => {
  try {
    const salons = await Salon.find({})
      .populate("package_id"); // Only SuperAdminPackage
    res.status(200).json({ message: "Salons fetched successfully", data: salons });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Single Salon by _id only
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const salon = await Salon.findById(id).populate("package_id");
    if (!salon) {
      return res.status(404).json({ message: "Salon not found" });
    }
    res.status(200).json({ message: "Salon fetched successfully", data: salon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Salon by _id only
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  try {
    if (req.file) {
      updateData.image = req.file.path;
    } else if (typeof updateData.image === "undefined" || updateData.image === "") {
      delete updateData.image;
    }
    const updatedSalon = await Salon.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedSalon) {
      return res.status(404).json({ message: "Salon not found" });
    }
    res.status(200).json({ message: "Salon updated successfully", data: updatedSalon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Salon by _id only
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedSalon = await Salon.findByIdAndDelete(id);
    if (!deletedSalon) {
      return res.status(404).json({ message: "Salon not found" });
    }
    res.status(200).json({ message: "Salon deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;