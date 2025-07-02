const twilio = require('twilio');
const nodemailer = require('nodemailer');
require('dotenv').config();

const twilioClient = twilio(process.envTWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendSMS = (phone, message) => {
    return twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
    });
};

const sendWhatsApp = (phone, message) => {
    return twilioClient.messages.create({
        from: 'whatsapp: ' + process.env.TWILIO_WHATSAPP_NUMBER,
        to: 'whatsapp: ' + phone,
        body: message
    });
};

const sendEmail = (email, subject, message) => {
    return transporter.sendEmail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        text: message
    });
};

module.exports = {
    sendSMS,
    sendWhatsApp,
    sendEmail
};