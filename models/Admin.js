const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    full_name: String,
    phone_number: {
        type: String,
        unique: true 
    },
    email: {
        type: String,
        unique: true
    },
    address: {
        type: String,
        unique: true
    },
    package_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SuperAdminPackage' 
    },
    package_start_date: Date,
    package_expiration_date: Date,
    password: String,
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);