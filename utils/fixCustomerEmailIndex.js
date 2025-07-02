// Run this script ONCE to fix duplicate email:null issues in your MongoDB
// Usage: node utils/fixCustomerEmailIndex.js

const mongoose = require('mongoose');
const Customer = require('../models/Customer');

const MONGO_URI = 'mongodb://localhost:27017/salon_admin'; // Change if needed

async function fixEmails() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Remove email field where it is null
  const res = await Customer.updateMany(
    { email: null },
    { $unset: { email: 1 } }
  );
  console.log('Unset email for docs with email:null:', res.modifiedCount);

  // Drop and recreate the unique sparse index
  await Customer.collection.dropIndex('email_1').catch(() => {});
  await Customer.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
  console.log('Recreated unique sparse index on email');

  await mongoose.disconnect();
  console.log('Done.');
}

fixEmails().catch(err => {
  console.error(err);
  process.exit(1);
});
