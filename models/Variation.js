const mongoose = require("mongoose");

const VariationSchema = new mongoose.Schema({
  branch_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    }
  ],
  name: {
    type: String,
    required: true,
  },
  value: [{
    type: String,
    required: false,
  }],
  type: {
    type: String,
    enum: ["Text", "Color"],
    required: true, 
  },
  status: {
    type: Number,
    enum: [0, 1],
    default: 1,
  },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model("Variation", VariationSchema);