const mongoose = require("mongoose");

const OrderProductSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    variant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variation"
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
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    salon_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Salon",
        required: true
    },
    branch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: true
    },
    products: {
        type: [OrderProductSchema],
        required: true
    },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    total_price: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        enum: ["cash", "card", "upi"],
        required: true
    },
    order_code: {
        type: String,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    invoice_pdf_url: {
        type: String
    }
});

// Auto-generate order_code before saving
OrderSchema.pre('save', async function (next) {
    if (this.isNew && !this.order_code) {
        // Example: ORD-YYYYMMDD-XXXX (XXXX = random 4 digits)
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        this.order_code = `ORD-${datePart}-${randomPart}`;
    }
    next();
});

module.exports = mongoose.model("Order", OrderSchema);
