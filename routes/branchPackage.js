const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const BranchPackage = require("../models/BranchPackage");
const Service = require("../models/Service");

// 📌 Utility: Calculate total package price from service list
function calculatePackagePrice(package_details) {
  let total = 0;
  for (const detail of package_details) {
    total += detail.discounted_price * detail.quantity;
  }
  return total;
}

// Create Branch Package with salon_id validation
router.post("/", upload.single("image"), (req, res) => {
  try {
    let { 
      branch_id,
      package_name,
      description,
      start_date,
      end_date,
      package_details,
      salon_id
    } = req.body;

    if (typeof package_details === "string") {
      try {
        package_details = JSON.parse(package_details);
      } catch (error) {
        return res.status(400).json({ message: "Invalid package_details format" });
      }
    }

    const package_price = calculatePackagePrice(package_details);

    const newBranchPackage = new BranchPackage({
      branch_id,
      package_name,
      description,
      start_date,
      end_date,
      package_details,
      package_price,
      salon_id
    });

    newBranchPackage.save()
      .then((savedPackage) => {
        res.status(201).json({ message: "Branch package created successfully", data: savedPackage });
      })
      .catch((error) => {
        res.status(500).json({ message: "Server error", error });
      });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Create a route to fetch package names and IDs
router.get('/names', async (req, res) => {
    try {
        const packages = await BranchPackage.find({}, 'package_name _id');
        res.status(200).json({ success: true, data: packages });
    } catch (error) {
        console.error('Error fetching package names:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all branch packages with salon_id filter
router.get("/", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const branchPackages = await BranchPackage.find({ salon_id }).populate("branch_id").populate("package_details.service_id");
    res.status(200).json({ message: "Branch packages fetched successfully", data: branchPackages });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ GET /api/branchPackage/:id - Get package by ID
router.get("/:id", async (req, res) => {
  try {
    const pkg = await BranchPackage.findById(req.params.id).populate("branch_id package_details.service_id");
    if (!pkg) return res.status(404).json({ message: "Package not found" });
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch package", error });
  }
});

// ✅ PUT /api/branchPackage/:id - Update a package
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    let { package_details, ...rest } = req.body;

    if (package_details && typeof package_details === "string") {
      try {
        package_details = JSON.parse(package_details);
      } catch (e) {
        return res.status(400).json({ message: "Invalid package_details format. Must be JSON." });
      }
    }
    if (package_details) {
      for (const detail of package_details) {
        const service = await Service.findOne({ _id: detail.service_id, status: 1 });
        if (!service) {
          return res.status(400).json({ message: `Inactive or invalid service: ${detail.service_id}` });
        }
      }
      rest.package_details = package_details;
    }
    const updatedPackage = await BranchPackage.findByIdAndUpdate(req.params.id, rest, { new: true });
    if (!updatedPackage) {
      return res.status(404).json({ message: "Package not found" });
    }
    res.status(200).json({ message: "Package updated successfully", data: updatedPackage });
  } catch (error) {
    res.status(500).json({ message: "Failed to update package", error });
  }
});

// ✅ DELETE /api/branchPackage/:id - Delete package
router.delete("/:id", async (req, res) => {
  try {
    await BranchPackage.findByIdAndDelete(req.params.id);
    res.json({ message: "Package deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete package", error });
  }
});

module.exports = router;
