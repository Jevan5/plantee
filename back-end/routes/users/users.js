const Auth = require('../../utils/auth');
const CryptoHelper = require('../../utils/cryptoHelper');
const { environment } = require('../../environment');
const express = require('express');
const router = express.Router();
const Mailer = require('../../utils/mailer');
const secrets = require('../../secrets.json');
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
            const authentication = CryptoHelper.generateAuthCode();
            const salt = CryptoHelper.generateRandomString();

            const user = await User.saveDoc({
                disabled: false,
                email: req.body.user.email,
                firstName: req.body.user.firstName,
                hashedAuthentication: CryptoHelper.hash(authentication, salt),
                hashedNewPassword: '',
                hashedPassword: CryptoHelper.hash(req.body.user.password, salt),
                lastName: req.body.user.lastName,
                salt: salt
            });

            await Mailer.sendRegistrationMail(user, authentication);

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
            let user = await User.findByEmail(req.query.email);
            if (user === null) throw `email (${req.query.email}) does not exist.`;

            const authentication = req.query.authentication.toUpperCase().trim();

            if (!Auth.pendingRegistrationAuthentication(user) && !Auth.pendingPasswordChangeAuthentication(user)) {
                res.send(`user (${user.email}) is not pending authentication.`);
                return;
            }

            if (!CryptoHelper.hashEquals(authentication, user.salt, user.hashedAuthentication)) throw `authentication (${authentication}) is invalid.`;

            if (Auth.pendingPasswordChangeAuthentication(user)) user.hashedPassword = user.hashedNewPassword;

            user.hashedAuthentication = '';
            user.hashedNewPassword = '';

            user = await User.saveDoc(user);

            res.send({ user });
        } catch (err) {
            res.status(500).send(err);
        }
    });

router.route('/changePassword')
    .put(async (req, res) => {
        try {
            let user = await User.findByEmail(req.query.email);
            if (user === null) throw `email (${req.query.email}) does not exist.`;

            if (Auth.pendingRegistrationAuthentication(user)) throw `user (${user.email}) has not yet authenticated.`;

            const authentication = CryptoHelper.generateAuthCode();

            user.hashedAuthentication = CryptoHelper.hash(authentication, user.salt);
            user.hashedNewPassword = CryptoHelper.hash(req.query.newPassword, user.salt);

            user = await User.saveDoc(user);

            await Mailer.sendPasswordChangeMail(user, authentication);

            res.send({ user });
        } catch (err) {
            res.status(500).send(err);
        }
    });

router.route('/regenerateAuthentication')
    .put(async (req, res) => {
        try {
            let user = await User.findByEmail(req.query.email);
            if (user === null) throw `email (${req.query.email}) does not exist.`;

            if (!Auth.pendingRegistrationAuthentication(user) && !Auth.pendingPasswordChangeAuthentication(user)) {
                res.send(`user (${user.email}) is not pending authentication.`);
                return;
            }

            const authentication = CryptoHelper.generateAuthCode();
            user.hashedAuthentication = CryptoHelper.hash(authentication, user.salt);
            user = await User.saveDoc(user);

            if (Auth.pendingRegistrationAuthentication(user)) await Mailer.sendRegistrationMail(user, authentication);
            else if (Auth.pendingPasswordChangeAuthentication(user)) await Mailer.sendPasswordChangeMail(user, authentication);

            res.send({ user });
        } catch (err) {
            res.status(500).send(err);
        }
    });

module.exports = router;
