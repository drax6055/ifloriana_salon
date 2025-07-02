const mongoose = require('mongoose');
const Counter = require('./models/Counter');

async function initializeCounter() {
    try {
        await mongoose.connect('mongodb://localhost:27017/salon_admin', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        const doc = await Counter.findOneAndUpdate(
            { _id: 'order' },
            { $setOnInsert: { sequence_value: 0 } },
            { upsert: true, new: true }
        );

        console.log('Counter initialized:', doc);
    } catch (err) {
        console.error('Error initializing Counter:', err);
    } finally {
        await mongoose.disconnect();
    }
}

initializeCounter();
