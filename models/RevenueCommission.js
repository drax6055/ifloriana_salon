const mongoose = require("mongoose");

const CommissionSlotSchema = new mongoose.Schema({
  slot: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  }
}, { _id: true }); // <-- this enables _id for each commission rule

const RevenueCommissionSchema = new mongoose.Schema({
  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true,
  },
  commission_name: {
    type: String,
    required: true,
  },
  commission_type: {
    type: String,
    enum: ["Percentage", "Fixed"],
    required: true,
  },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true,
  },
  commission: [CommissionSlotSchema] // now each item has its own _id
});

module.exports = mongoose.model("RevenueCommission", RevenueCommissionSchema);