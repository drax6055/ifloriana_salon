const express = require("express");
const router = express.Router();
const QuickBooking = require("../models/QuickBooking");
const Customer = require("../models/Customer");
const mongoose = require("mongoose");

// Create a new quick booking
router.post("/", async (req, res) => {
  const { salon_id, ...bookingData } = req.body;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    // If customer_id is provided, skip customer creation and just use it
    let customerId = bookingData.customer_id;
    if (!customerId) {
      // Extract customer details from bookingData
      const customerDetails = bookingData.customer_details;
      if (!customerDetails || !customerDetails.phone_number || !customerDetails.full_name) {
        return res.status(400).json({ message: "Customer details with full_name and phone_number are required" });
      }

      // Check if customer exists by phone_number (and salon_id)
      let customerQuery = {
        phone_number: customerDetails.phone_number,
        salon_id: salon_id
      };
      if (customerDetails.email) {
        customerQuery.email = customerDetails.email;
      }
      let existingCustomer = await Customer.findOne(customerQuery);

      // If not found, try by phone_number only (in case email is not unique)
      if (!existingCustomer) {
        existingCustomer = await Customer.findOne({
          phone_number: customerDetails.phone_number,
          salon_id: salon_id
        });
      }

      // If customer does not exist, create
      if (!existingCustomer) {
        const newCustomerData = {
          full_name: customerDetails.full_name,
          phone_number: customerDetails.phone_number,
          gender: customerDetails.gender,
          salon_id: salon_id
        };
        if (customerDetails.email && customerDetails.email.trim() !== "") {
          newCustomerData.email = customerDetails.email;
        }
        const newCustomer = new Customer(newCustomerData);
        const savedCustomer = await newCustomer.save();
        customerId = savedCustomer._id;
      } else {
        customerId = existingCustomer._id;
      }
    }

    // Attach customer_id to bookingData
    bookingData.customer_id = customerId;

    // Ensure staff_id is an array of ObjectIds as per schema
    if (bookingData.staff_id) {
      if (!Array.isArray(bookingData.staff_id)) {
        bookingData.staff_id = [bookingData.staff_id];
      }
      bookingData.staff_id = bookingData.staff_id.map(id => new mongoose.Types.ObjectId(id));
    }

    // Ensure payment_status is either 'Pending' or 'Paid'
    if (bookingData.payment_status && !["Pending", "Paid"].includes(bookingData.payment_status)) {
      return res.status(400).json({ message: "payment_status must be either 'Pending' or 'Paid'" });
    }

    // Ensure date and time fields are present
    if (!bookingData.date || !bookingData.time) {
      return res.status(400).json({ message: "Both date and time are required" });
    }

    const quickBooking = new QuickBooking({ salon_id, ...bookingData });
    const savedQuickBooking = await quickBooking.save();
    res.status(201).json(savedQuickBooking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all quick bookings
router.get("/", async (req, res) => {
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const quickBookings = await QuickBooking.find({ salon_id })
      .populate("customer_id")
      .populate("branch_id")
      .populate("service_id")
      .populate("staff_id");
    res.status(200).json(quickBookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single quick booking by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const quickBooking = await QuickBooking.findOne({ _id: id, salon_id })
      .populate("customer_id")
      .populate("branch_id")
      .populate("service_id")
      .populate("staff_id");
    if (!quickBooking) return res.status(404).json({ error: "Quick booking not found" });
    res.status(200).json(quickBooking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a quick booking by ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id, ...updateData } = req.body;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    // Ensure staff_id is an array of ObjectIds as per schema
    if (updateData.staff_id) {
      if (!Array.isArray(updateData.staff_id)) {
        updateData.staff_id = [updateData.staff_id];
      }
      updateData.staff_id = updateData.staff_id.map(id => new mongoose.Types.ObjectId(id));
    }
    // Ensure payment_status is either 'Pending' or 'Paid'
    if (updateData.payment_status && !["Pending", "Paid"].includes(updateData.payment_status)) {
      return res.status(400).json({ message: "payment_status must be either 'Pending' or 'Paid'" });
    }
    // Ensure date and time fields are present
    if (updateData.date && updateData.time) {
      // ok
    } else if (updateData.date || updateData.time) {
      return res.status(400).json({ message: "Both date and time are required if updating either" });
    }
    const updatedQuickBooking = await QuickBooking.findOneAndUpdate({ _id: id, salon_id }, updateData, { new: true })
      .populate("customer_id")
      .populate("branch_id")
      .populate("service_id")
      .populate("staff_id");
    if (!updatedQuickBooking) return res.status(404).json({ error: "Quick booking not found" });
    res.status(200).json(updatedQuickBooking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a quick booking by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { salon_id } = req.query;

  if (!salon_id) {
    return res.status(400).json({ message: "salon_id is required" });
  }

  try {
    const deletedQuickBooking = await QuickBooking.findOneAndDelete({ _id: id, salon_id });
    if (!deletedQuickBooking) return res.status(404).json({ error: "Quick booking not found" });
    res.status(200).json({ message: "Quick booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
