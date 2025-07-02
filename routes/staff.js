const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Staff = require("../models/Staff");
const Service = require("../models/Service");
const router = express.Router();
const mongoose = require("mongoose");

// Create Staff
router.post("/", async (req, res) => {
  const {
    full_name,
    email,
    phone_number,
    password,
    confirm_password,
    gender,
    branch_id,
    salon_id,
    service_id,
    status,
    image,
    salary,
    show_in_calendar,
    assign_time,
    lunch_time,
    assigned_commission_id,
  } = req.body;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newStaff = new Staff({
      full_name,
      email,
      phone_number,
      password: hashedPassword,
      gender,
      branch_id,
      salon_id,
      service_id,
      status,
      image,
      salary,
      show_in_calendar,
      assign_time,
      lunch_time,
      assigned_commission_id,
    });
    await newStaff.save();

    res.status(201).json({ message: "Staff created successfully", data: newStaff });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Staff Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: staff._id }, "secretKey", { expiresIn: "1h" });
    res.status(201).json({ token, message: "Login successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get All Staff
router.get("/", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const staff = await Staff.find({ salon_id }).populate("branch_id").populate("service_id");
    res.status(200).json({ message: "Staff fetched successfully", data: staff });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get staff names and IDs by salon_id
router.get("/names", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const staffList = await Staff.find(
      { salon_id },
      { _id: 1, full_name: 1 }
    ).lean();

    res.status(200).json({
      message: "Staff names and IDs fetched successfully",
      data: staffList,
    });
  } catch (error) {
    console.error("Error fetching staff names:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get Single Staff
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const staff = await Staff.findOne({ _id: id, salon_id }).populate("branch_id").populate("service_id");
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.status(200).json({ message: "Staff fetched successfully", data: staff });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Staff
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id, ...updateData } = req.body;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const updatedStaff = await Staff.findOneAndUpdate({ _id: id, salon_id }, updateData, { new: true });
    if (!updatedStaff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.status(200).json({ message: "Staff updated successfully", data: updatedStaff });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Staff
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const deletedStaff = await Staff.findOneAndDelete({ _id: id, salon_id });
    if (!deletedStaff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.status(200).json({ message: "Staff deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;