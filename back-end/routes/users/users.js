const Auth = require('../../utils/auth');
const CryptoHelper = require('../../utils/cryptoHelper');
const { environment } = require('../../environment');
const express = require('express');
const router = express.Router();
const Mailer = require('../../utils/mailer');
const User = require('../../models/user/user');

router.route('/')
    .get(async (req, res) => {
        try {
            res.send({ users: await User.find() });
        } catch (err) {
            res.status(500).send(err);
        }
    })
    .post(async (req, res) => {
        try {
            const authentication = CryptoHelper.generateRandomString(CryptoHelper.authenticationLength).toUpperCase();
            const salt = CryptoHelper.generateRandomString();

            const user = await User.saveDoc({
                disabled: false,
                email: req.body.user.email,
                firstName: req.body.user.firstName,
                hashedAuthentication: CryptoHelper.hash(authentication, salt),
                hashedPassword: CryptoHelper.hash(req.body.user.password, salt),
                lastName: req.body.user.lastName,
                salt: salt
            });

            await Mailer.sendMail(user.email, 'Authenticate Account', `Hi ${user.firstName},\n\nOn behalf of the entire team, welcome to Plantee ${String.fromCodePoint(0x1F973)}\n\nWe designed Plantee to help people like yourself and us who want to keep our ${String.fromCodePoint(0x1F331)}'s alive and ${String.fromCodePoint(0x1F603)}\n\nPlease use this authentication code to authenticate your account: ${authentication}\n\nHappy planting ${String.fromCodePoint(0x1F44B)}\n\nCheers,\nJosh Evans\nFounder of Plantee`);

            res.send({ user: user });
        } catch (err) {
            res.status(500).send(err);
        }
    });

router.route('/login')
    .get(async (req, res) => {
        try {
            res.send({ user: await Auth.authenticateRequest(req) });
        } catch (err) {
            res.status(500).send(err);
        }
    });

router.route('/authenticate')
    .put(async (req, res) => {
        try {
            const user = await User.findOne({ email: req.query.email.toLowerCase().trim() });
            if (user === null) throw `email (${req.query.email}) does not exist.`;

            if (user.hashedAuthentication === '') {
                res.send(`user (${user.email}) is already authenticated.`);
                return;
            }

            if (!CryptoHelper.hashEquals(req.query.authentication.toUpperCase(), user.salt, user.hashedAuthentication)) throw `authentication (${req.query.authentication}) is invalid.`;

            user.hashedAuthentication = '';

            await user.save();

            res.send({ message: `user (${user.email}) has been authenticated.` });
        } catch (err) {
            res.status(500).send(err);
        }
    });

module.exports = router;
