const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SuperAdmin = require("../models/SuperAdmin");
const router = express.Router();

// Register SuperAdmin
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newSuperAdmin = new SuperAdmin({ name, email, password: hashedPassword });
    await newSuperAdmin.save();

    res.status(201).json({
        message: "SuperAdmin registered successfully",
        superAdmin: {
            _id: newSuperAdmin._id, // Include the ID
            name: newSuperAdmin.name,
            email: newSuperAdmin.email
        }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login SuperAdmin
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const superAdmin = await SuperAdmin.findOne({ email });
    if (!superAdmin) {
      return res.status(404).json({ message: "SuperAdmin not found" });
    }

    const isMatch = await bcrypt.compare(password, superAdmin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: superAdmin._id }, "secretKey", { expiresIn: "1h" });
    res.status(201).json({ token, message: "Login successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get All SuperAdmins
router.get("/superadmins", async (req, res) => {
  try {
    const superAdmins = await SuperAdmin.find().select("-password");
    res.status(200).json({ message: "SuperAdmins fetched successfully", data: superAdmins });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update SuperAdmin
router.put("/superadmins/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedSuperAdmin = await SuperAdmin.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedSuperAdmin) {
      return res.status(404).json({ message: "SuperAdmin not found" });
    }
    res.status(200).json({ message: "SuperAdmin updated successfully", data: updatedSuperAdmin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete SuperAdmin
router.delete("/superadmins/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSuperAdmin = await SuperAdmin.findByIdAndDelete(id);
    if (!deletedSuperAdmin) {
      return res.status(404).json({ message: "SuperAdmin not found" });
    }
    res.status(200).json({ message: "SuperAdmin deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;