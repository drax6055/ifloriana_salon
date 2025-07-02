const mongoose = require("mongoose");

const ProductCategorySchema = new mongoose.Schema({
  branch_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    } 
  ],
  image: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  brand_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    }
  ],
  status: {
    type: Number,
    enum: [0, 1],
    default: 1,
  },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("ProductCategory", ProductCategorySchema);