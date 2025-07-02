const mongoose = require('mongoose');

const superAdminPackageSchema = new mongoose.Schema({
    package_name: String,
    description: String,
    price: Number,
    services_included: {
        type: [String]
    },
    subscription_plan: {
        type: String,
        enum:['1-month', '3-months', '6-months', '1-year']
    }
});

module.exports = mongoose.model('SuperAdminPackage', superAdminPackageSchema);