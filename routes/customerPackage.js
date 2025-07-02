const express = require("express");
const router = express.Router();
const CustomerPackage = require("../models/CustomerPackage");

// Get all customer packages filtered by salon_id with necessary population
// Updated GET route to include image in customer details
router.get("/", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const customerPackages = await CustomerPackage.find({ salon_id })
      .populate("customer_id", "full_name email phone_number image")
      .populate("package_details.service_id", "name price");

    res.status(200).json({ success: true, data: customerPackages });
  } catch (error) {
    console.error("Error fetching customer packages:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all packages bought by a customer
router.get("/by-customer/:customer_id", async (req, res) => {
  try {
    const packages = await CustomerPackage.find({ customer_id: req.params.customer_id })
      .populate("package_details.service_id", "name")
      .populate("branch_id", "name");

    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update service quantity after usage
router.patch("/use-service/:package_id/:service_id", async (req, res) => {
  try {
    const { package_id, service_id } = req.params;

    const customerPackage = await CustomerPackage.findById(package_id);
    if (!customerPackage) {
      return res.status(404).json({ message: "CustomerPackage not found" });
    }

    // Find the service inside package
    const service = customerPackage.package_details.find(item => item.service_id.toString() === service_id);
    if (!service || service.quantity <= 0) {
      return res.status(400).json({ message: "Service not available or already used up" });
    }

    service.quantity -= 1;
    await customerPackage.save();

    res.status(200).json({ message: "Service usage updated", data: customerPackage });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;