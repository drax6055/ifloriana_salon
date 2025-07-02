const cron = require('node-cron');
const checkExpiringPackages = require('../utils/notifyExpiringPackages');

cron.schedule('0 10 * * *', async () => {
    console.log('Running daily expiry check...');
    await checkExpiringPackages();
});