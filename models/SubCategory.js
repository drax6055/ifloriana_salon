const mongoose = require("mongoose");

const SubCategorySchema = new mongoose.Schema({
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  status: {
    type: Number,
    enum: [0, 1],
    default: 1,
  },
}, { timestamps: true });

module.exports = mongoose.model("SubCategory", SubCategorySchema);