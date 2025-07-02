const mongoose = require("mongoose");

const CustomerMembershipSchema = new mongoose.Schema({
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
  branch_membership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BranchMembership",
    required: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model("CustomerMembership", CustomerMembershipSchema);
