const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  image: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  service_duration: {
    type: Number,
    required: true,
  },
  regular_price: {
    type: Number,
    required: true,  
  },
  members_price: {
    type: Number,
    required: false,  
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  description: {
    type: String,
    required: false,
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
  },
}, { timestamps: true });

module.exports = mongoose.model("Service", ServiceSchema);