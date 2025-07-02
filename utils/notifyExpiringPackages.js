const admin = require('../models/Admin');
const { sendSMS, sendWhatsApp, sendEmail } = require('./notifiers');

const checkExpiringPackages = async () => {
    try {
        const admins = await Admin.find();
        const today = new Date();
        const weekFromNow = new Date();
        weekFromNow.setDate(today.getDate() + 7);

        for (const admin of admins) {
            const exp = admin.package_expiration_date;
            if(!exp) continue;

            if(exp.toDateString() === weekFromNow.toDateString()) {
                const msg = `Hi ${admin.full_name}, your package is expiring on ${exp.toDateString()}. Please renew.`;
                await sendSMS(admin.phone_number, msg);
                await sendWhatsApp(admin.phone_number, msg);
                await sendEmail(admin.email, "Package Expiry Reminder", msg);
            }
        }
    } catch (error) {
        console.error("Error checking package expirations: ", error);
    }
};

module.exports = checkExpiringPackages;