const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    // OAuth2 configuration
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN
    }

});

// Verify  
transporter.verify((error, success) => {
    if (error) {
        console.error('Error configuring nodemailer transporter:', error);
    } else {
        console.log('Nodemailer transporter is configured successfully');
    }
});


async function sendEmail(to, subject, text) {
    const mailOptions = {
        from: `"Ledger Team" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

module.exports = sendEmail;