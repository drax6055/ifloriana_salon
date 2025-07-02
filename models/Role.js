const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    import_from_role: {
        type: String,
        enum: ['admin', 'manager', 'staff', 'customer'],
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);