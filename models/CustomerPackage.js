const mongoose = require("mongoose");

const CustomerPackageSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true
  },
  package_name: String,
  description: String,
  package_price: Number,
  start_date: Date,
  end_date: Date,
  package_details: [
    {
      service_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service"
      },
      discounted_price: Number,
      quantity: Number
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model("CustomerPackage", CustomerPackageSchema);
