const nodemailer = require('nodemailer');
const secrets = require('../secrets.json');

class Mailer {
    static async sendMail(recipient, subject, body) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: secrets.email,
                pass: secrets.password
            }
        });

        const mailOptions = {
            from: secrets.email,
            subject,
            text: body,
            to: recipient
        };

        await transporter.sendMail(mailOptions);
    }
}

module.exports = Mailer;
