const mongoose = require("mongoose");

const TagSchema = new mongoose.Schema({
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

module.exports = mongoose.model("Tag", TagSchema);