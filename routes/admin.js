// routes/admin.js
const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Salon = require('../models/Salon');
const bcrypt = require('bcryptjs');

// Get all admins
router.get("/all", async (req, res) => {
  try {
    const admins = await Admin.find().populate("package_id");
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Update admin by ID
router.put('/:id', async (req, res) => {
  try {
    const { password, salonDetails, ...adminFields } = req.body;

    const updateData = { ...adminFields };

    // Handle password update only if it's non-empty
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // ✅ Update admin fields
    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // ✅ Update salon details (combined update)
    if (salonDetails) {
      const salonUpdate = {};
      if (salonDetails.salon_name) salonUpdate.salon_name = salonDetails.salon_name;
      if (salonDetails.image) salonUpdate.image = salonDetails.image;

      if (Object.keys(salonUpdate).length > 0) {
        await Salon.findOneAndUpdate(
          { signup_id: req.params.id },
          salonUpdate,
          { new: true }
        );
      }
    }

    // ✅ Fetch salon details after update
    const salonDetailsFetched = await Salon.findOne({ signup_id: req.params.id });

    res.status(200).json({
      message: 'Admin updated successfully',
      data: updatedAdmin,
      salonDetails: salonDetailsFetched,
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(500).json({ message: 'Server error', error });
  }
});


// Delete admin by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedAdmin = await Admin.findByIdAndDelete(req.params.id);
    if (!deletedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get single admin by ID
router.get("/:id", async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).populate("package_id");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Fetch salon details using signup_id
    const salonDetails = await Salon.findOne({ signup_id: req.params.id });

    res.status(200).json({
      admin,
      salonDetails,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;