const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true
  },
  appointment_date: {
    type: Date,
    required: true
  },
  appointment_time: {
    type: String,
    required: true
  },
  services: [
    {
      service_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
      },
      staff_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
        required: true
      },
      service_amount: {
        type: Number,
        default: 0
      },
      used_package: {
        type: Boolean,
        default: false
      },
      package_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CustomerPackage",
        default: null
      }
    }
  ],
  products: [
    {
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      variant_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      },
      quantity: {
        type: Number,
        required: true
      },
      unit_price: {
        type: Number,
        required: true
      },
      total_price: {
        type: Number,
        required: true
      }
    }
  ],
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ["upcoming", "cancelled", "check-in", "check-out"],
    default: "upcoming"
  },
  grand_total: {
    type: Number
  },
  total_payment: {
    type: Number
  },
  payment_status: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending"
  },
  order_code: {
    type: String,
    default: function () {
      return `ORD-${Date.now().toString().slice(-10)}`;
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Appointment", appointmentSchema);