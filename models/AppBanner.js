const mongoose = require('mongoose');

const AppBannerSchema = new mongoose.Schema({
    image: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: false
    },
    type: {
        type: String,
        enum: ['category', 'service'],
        required: true
    },
    link_id: {
        type: String,
        required: false
    },
    status: {
        type: Number,
        enum: [0, 1],
        default: 1
    },
    salon_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Salon',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('AppBanner', AppBannerSchema);