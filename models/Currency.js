const mongoose = require('mongoose');

const CurrencySchema = new mongoose.Schema({
    currency_name: {
        type: String,
        required: true
    },
    currency_symbol: {
        type: String,
        default: '₹'
    },
    currency_code: {
        type: String,
        required: true
    },
    is_primary: {
        type: Number,
        enum: [0, 1],
        default: 0
    },
    currency_position: {
        type: String,
        enum: ['left', 'right', 'left_with_space', 'right_with_space'],
        default: 'left',
    },
    thousand_separator: {
        type: String,
        default: ','
    },
    decimal_separator: {
        type: String,
        default: '.'
    },
    number_of_decimal: {
        type: Number,
        default: 2
    },
    salon_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Salon',
        required: true
    }
});

module.exports = mongoose.model('Currency', CurrencySchema);