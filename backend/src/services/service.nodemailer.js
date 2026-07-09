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

// email for registration
async function sendRegistrationEmail(to, subject, text) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    }
    try {
        await transporter.sendMail(mailOptions);
        console.log('Registration email sent successfully to');

    } catch (error) {
        console.error('Error sending Registration email:', error);
    }

}

// transaction done email
async function sendTransactionDoneEmail(to, subject, text) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    }
    try {
        await transporter.sendMail(mailOptions);
        console.log('Transaction Done email sent successfully to');
    } catch (error) {
        console.error('Error sending Transaction Done email:', error);
    }

};

// transaction failed email
async function sendTransactionFailedEmail(to, subject, text) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    }
    try {
        await transporter.sendMail(mailOptions);
        console.log('Transaction Failed email sent successfully to');
    } catch (error) {
        console.error('Error sending Transaction Failed email:', error);
    }
};




async function sendOtpEmail(to, otp) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Password Reset OTP',
        text: `Your password reset OTP code is: ${otp}. It will expire in 10 minutes.`
    }
    try {
        await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully');
    } catch (error) {
        console.error('Error sending OTP email:', error);
    }
}

module.exports = {
    sendRegistrationEmail,
    sendTransactionDoneEmail,
    sendTransactionFailedEmail,
    sendOtpEmail
};

