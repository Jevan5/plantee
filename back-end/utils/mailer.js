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

    static async sendRegistrationMail(user, authentication) {
        await Mailer.sendMail(user.email, 'Authenticate Account', `Hi ${user.firstName},\n\nOn behalf of the entire team, welcome to Plantee ${String.fromCodePoint(0x1F973)}\n\nWe designed Plantee to help people like yourself and us who want to keep our ${String.fromCodePoint(0x1F331)}'s alive and ${String.fromCodePoint(0x1F603)}\n\nPlease use this authentication code to authenticate your account: ${authentication}\n\nHappy planting ${String.fromCodePoint(0x1F44B)}\n\nCheers,\nJosh Evans\nFounder of Plantee`);
    }

    static async sendPasswordChangeMail(user, authentication) {
        await Mailer.sendMail(user.email, 'Password Reset', `Hi ${user.firstName},\n\nWe have been notified about your password reset ${String.fromCodePoint(0x1F512)}${String.fromCodePoint(0x1F504)}\n\nPlease use this authentication code to finish changing your password: ${authentication}\n\nIf you did not request to change your password, please notify us at ${secrets.email} ${String.fromCodePoint(0x1F575)}\n\nCheers,\nJosh Evans\nFounder of Plantee`);
    }
}

module.exports = Mailer;
