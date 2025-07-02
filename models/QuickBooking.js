const mongoose = require("mongoose");

const QuickBookingSchema = new mongoose.Schema({
    branch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: true,
    },
    service_id: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true,
        }
    ],
    staff_id: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff",
            required: true,
        }
    ],
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    customer_details: {
        full_name: {
            type: String,
            required: function() { return !this.customer_id; }
        },
        email: {
            type: String,
            required: false
        },
        phone_number: {
            type: String,
            required: function() { return !this.customer_id; }
        },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
            required: function() { return !this.customer_id; }
        },
    },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: false,
    },
    payment_status: {
        type: String,
        enum: ["Pending", "Paid"],
        required: true,
    },
    salon_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Salon",
        required: true,
    },
}, { timestamps: true });

// Ensure at least one of customer_id or customer_details is present
QuickBookingSchema.pre('validate', function(next) {
    if (!this.customer_id && (!this.customer_details || !this.customer_details.full_name || !this.customer_details.phone_number || !this.customer_details.gender)) {
        return next(new Error('Either customer_id or complete customer_details (full_name, phone_number, gender) must be provided.'));
    }
    next();
});

module.exports = mongoose.model("QuickBooking", QuickBookingSchema);
