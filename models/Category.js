const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  status: {
    type: Number,
    enum: [0, 1],
    default: 1,
  },
}, { timestamps: true });

module.exports = mongoose.model("Category", CategorySchema);