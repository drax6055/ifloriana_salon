const mongoose = require('mongoose');

const BranchMembershipSchema = new mongoose.Schema({
    salon_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Salon",
        required: true,
    },
    membership_name: {
        type: String,
        required: true,
    },
    description: {
        type: String, 
        required: true,
    },
    subscription_plan: {
        type: String,
        enum: ['1-month', '3-months', '6-months', '12-months', 'lifetime'],
    },
    status: {
        type: Number,
        enum: [0, 1],
        default: 1,
    },
    discount: {
        type: Number,
        required: true,
    },
    discount_type: {
        type: String,
        enum: ["percentage", "fixed"],
        required: true,
    },
    membership_amount: {
        type: Number,
        required: true,
    },
});

module.exports = mongoose.model("BranchMembership", BranchMembershipSchema);