const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const BranchPackage = require("../models/BranchPackage");
const BranchMembership = require("../models/BranchMembership");
const CustomerPackage = require("../models/CustomerPackage");
const CustomerMembership = require("../models/CustomerMembership");
const multer = require("multer");
const path = require("path");
const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Only .jpg, .jpeg, and .png formats are allowed!"), false);
    }
};

const upload = multer({ storage, fileFilter });

// Create Customer
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const {
      salon_id,
      full_name,
      email,
      gender,
      password,
      phone_number,
      status,
      branch_package,
      branch_membership
    } = req.body;

    const image = req.file ? req.file.path : null;

    let newCustomerData = {
      salon_id,
      full_name,
      gender,
      password,
      phone_number,
      status,
      image
    };

    // ✅ Only include email if it's not empty or null
    if (email && email.trim() !== "") {
      newCustomerData.email = email.trim();
    }

    // ✅ Branch Package Handling
    if (branch_package) {
      const pkg = await BranchPackage.findById(branch_package);
      if (!pkg) return res.status(400).json({ message: "Invalid BranchPackage ID" });

      newCustomerData.branch_package = branch_package;
      newCustomerData.branch_package_bought_at = new Date();
      newCustomerData.branch_package_valid_till = pkg.end_date;
    }

    // ✅ Branch Membership Handling
    if (branch_membership) {
      const membership = await BranchMembership.findById(branch_membership);
      if (!membership) return res.status(400).json({ message: "Invalid BranchMembership ID" });

      let monthsToAdd = 0;
      if (membership.subscription_plan !== "lifetime") {
        monthsToAdd = parseInt(membership.subscription_plan.split("-")[0]);
      }

      const now = new Date();
      let validTill = membership.subscription_plan === "lifetime"
        ? null
        : new Date(now.setMonth(now.getMonth() + monthsToAdd));

      newCustomerData.branch_membership = branch_membership;
      newCustomerData.branch_membership_bought_at = new Date();
      newCustomerData.branch_membership_valid_till = validTill;
    }

    const newCustomer = new Customer(newCustomerData);
    await newCustomer.save();

    // ✅ Create CustomerMembership Record
    if (branch_membership) {
      const membership = await BranchMembership.findById(branch_membership);
      let monthsToAdd = 0;
      if (membership.subscription_plan !== "lifetime") {
        monthsToAdd = parseInt(membership.subscription_plan.split("-")[0]);
      }

      const now = new Date();
      const validTill = membership.subscription_plan === "lifetime"
        ? null
        : new Date(now.getTime() + monthsToAdd * 30 * 24 * 60 * 60 * 1000);

      await CustomerMembership.create({
        customer_id: newCustomer._id,
        salon_id,
        branch_membership,
        start_date: new Date(),
        end_date: validTill
      });
    }

    res.status(201).json({ message: "Customer created successfully", data: newCustomer });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ message: "Server error", error });
  }
});


// Route for creating a customer with image upload
router.post("/upload", upload.single("image"), async (req, res) => {
    try {
        const { full_name, email, phone_number, gender, status } = req.body;
        const image = req.file ? req.file.path : null;

        // Save customer details with the image path
        const newCustomer = await Customer.create({
            full_name,
            email,
            phone_number,
            gender,
            status,
            image,
        });

        res.status(201).json({ message: "Customer created successfully", data: newCustomer });
    } catch (error) {
        console.error("Error creating customer with image:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get all customers
router.get("/", async (req, res) => {
    const { salon_id } = req.query;

    if (!salon_id) {
        return res.status(400).json({ message: "salon_id is required" });
    }

    try {
        const customers = await Customer.find({ salon_id })
            .select("-password")
            .populate("salon_id")
            .populate({
                path: "branch_package",
                populate: {
                    path: "package_details.service_id",
                    select: "name",
                },
            })
            .populate("branch_membership")
            .sort({ createdAt: -1 });

        res.status(200).json({ message: "Customers fetched successfully", data: customers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get customer names and IDs by salon_id
router.get("/names", async (req, res) => {
    const { salon_id } = req.query;
    if (!salon_id) {
        return res.status(400).json({ message: "salon_id is required" });
    }

    try {
        const customers = await Customer.find(
            { salon_id },
            { _id: 1, full_name: 1 }
        ).lean();

        res.status(200).json({
            message: "Customer names and IDs fetched successfully",
            data: customers,
        });
    } catch (error) {
        console.error("Error fetching customer names:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get single customer
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const { salon_id } = req.query;

    if (!salon_id) {
        return res.status(400).json({ message: "salon_id is required" });
    }

    try {
        const customer = await Customer.findOne({ _id: id, salon_id })
            .select("-password")
            .populate("salon_id branch_package branch_membership");

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        res.status(200).json({ message: "Customer fetched successfully", data: customer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// PUT update also adds CustomerMembership
// Update customer
router.put("/:id", upload.single("image"), async (req, res) => {
    const { id } = req.params;
    const { salon_id, branch_package, branch_membership } = req.body;

    if (!salon_id) {
        return res.status(400).json({ message: "salon_id is required" });
    }

    try {
        let updateData = { ...req.body };

        if (req.file) {
            updateData.image = req.file.path;
        }

        // Optional: Branch Package
        if (branch_package) {
            const pkg = await BranchPackage.findById(branch_package);
            if (!pkg) return res.status(400).json({ message: "Invalid BranchPackage ID" });

            updateData.branch_package = branch_package;
            updateData.branch_package_bought_at = new Date();
            updateData.branch_package_valid_till = pkg.end_date;

            await CustomerPackage.create({
                customer_id: id,
                salon_id,
                branch_package,
                start_date: new Date(),
                end_date: pkg.end_date,
                package_details: pkg.package_details || [],
            });
        }

        // Optional: Branch Membership
        if (branch_membership) {
            const membership = await BranchMembership.findById(branch_membership);
            if (!membership) return res.status(400).json({ message: "Invalid BranchMembership ID" });

            let monthsToAdd = 0;
            if (membership.subscription_plan !== "lifetime") {
                monthsToAdd = parseInt(membership.subscription_plan.split("-")[0]);
            }

            const now = new Date();
            const validTill = membership.subscription_plan === "lifetime"
                ? null
                : new Date(now.setMonth(now.getMonth() + monthsToAdd));

            updateData.branch_membership = branch_membership;
            updateData.branch_membership_bought_at = new Date();
            updateData.branch_membership_valid_till = validTill;

            // ✅ Avoid duplicate CustomerMembership records
            const alreadyExists = await CustomerMembership.findOne({
                customer_id: id,
                branch_membership,
            });

            if (!alreadyExists) {
                await CustomerMembership.create({
                    customer_id: id,
                    salon_id,
                    branch_membership,
                    start_date: new Date(),
                    end_date: validTill,
                });
            }
        }

        const updatedCustomer = await Customer.findOneAndUpdate(
            { _id: id, salon_id },
            updateData,
            { new: true }
        );

        if (!updatedCustomer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        res.json({ message: "Customer updated", data: updatedCustomer });
    } catch (error) {
        console.error("Error updating customer:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Patch: update only branch_package
router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const { salon_id, branch_package } = req.body;

    if (!salon_id || !branch_package) {
        return res.status(400).json({ message: "salon_id and branch_package are required" });
    }

    try {
        const customer = await Customer.findOne({ _id: id, salon_id });
        if (!customer) return res.status(404).json({ message: "Customer not found" });

        const pkg = await BranchPackage.findById(branch_package);
        if (!pkg) return res.status(400).json({ message: "Invalid BranchPackage ID" });

        customer.branch_package = branch_package;
        customer.branch_package_valid_till = pkg.end_date;
        customer.branch_package_bought_at = new Date();

        // Store CustomerPackage entry
        await CustomerPackage.create({
            customer_id: customer._id,
            salon_id,
            branch_package,
            start_date: new Date(),
            end_date: pkg.end_date,
            package_details: pkg.package_details || [],
        });

        await customer.save();

        res.status(200).json({ message: "Branch package updated", data: customer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
});

// Patch: update only branch_membership
router.patch("/update-branch-membership/:id", async (req, res) => {
    const { id } = req.params;
    const { salon_id, branch_membership } = req.body;

    if (!salon_id || !branch_membership) {
        return res.status(400).json({ message: "salon_id and branch_membership are required" });
    }

    try {
        const customer = await Customer.findOne({ _id: id, salon_id });
        if (!customer) return res.status(404).json({ message: "Customer not found" });

        if (customer.branch_membership) {
            return res.status(400).json({ message: "Cannot update branch_membership as it already exists" });
        }

        const membership = await BranchMembership.findById(branch_membership);
        if (!membership) return res.status(400).json({ message: "Invalid BranchMembership ID" });

        const validTill = new Date();
        switch (membership.subscription_plan) {
            case "1-month":
                validTill.setMonth(validTill.getMonth() + 1);
                break;
            case "3-months":
                validTill.setMonth(validTill.getMonth() + 3);
                break;
            case "6-months":
                validTill.setMonth(validTill.getMonth() + 6);
                break;
            case "12-months":
                validTill.setMonth(validTill.getMonth() + 12);
                break;
            case "lifetime":
                validTill.setFullYear(validTill.getFullYear() + 70);
                break;
            default:
                return res.status(400).json({ message: "Invalid subscription plan" });
        }

        customer.branch_membership = branch_membership;
        customer.branch_membership_valid_till = validTill;
        customer.branch_membership_bought_at = new Date();

        await customer.save();

        res.status(200).json({ message: "Branch membership updated", data: customer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
});

// Delete customer
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const { salon_id } = req.query;

    if (!salon_id) {
        return res.status(400).json({ message: "salon_id is required" });
    }

    try {
        const deletedCustomer = await Customer.findOneAndDelete({ _id: id, salon_id });
        if (!deletedCustomer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Delete all associated CustomerPackage records
        await CustomerPackage.deleteMany({ customer_id: id });

        res.status(200).json({ message: "Customer and associated packages deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Customer count
router.get("/count", async (req, res) => {
    const { salon_id } = req.query;

    if (!salon_id) {
        return res.status(400).json({ message: "salon_id is required" });
    }

    try {
        const totalCustomers = await Customer.countDocuments({ salon_id });
        res.status(200).json({ totalCustomers });
    } catch (error) {
        res.status(500).json({ message: "Error fetching customer count", error });
    }
});

module.exports = router;