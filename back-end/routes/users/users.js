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
            const user = await User.authenticateRequest(req);

            res.send({ user });
        } catch (err) {
            res.status(500).send(err);
        }
    })
    .post(async (req, res) => {
        try {
            const authentication = User.generateAuthCode();
            const salt = User.generateSalt();

            const user = await User.saveDoc({
                disabled: false,
                email: req.body.user.email,
                firstName: req.body.user.firstName,
                hashedAuthentication: CryptoHelper.hash(authentication, salt),
                hashedNewPassword: null,
                hashedPassword: CryptoHelper.hash(req.body.user.password, salt),
                hashedTokenAndIp: null,
                lastName: req.body.user.lastName,
                salt: salt,
                tokenGeneratedTimestamp: Date.now()
            });

            await Mailer.sendRegistrationMail(user, authentication);

            res.send({ user });
        } catch (err) {
            res.status(500).send(err);
        }
    });

router.route('/login')
    .post(async (req, res) => {
        try {
            const user = await User.authenticateLogin(req);
            const token = User.generateToken();

            user.hashedTokenAndIp = user.hash(User.concatenateTokenAndIp(token, req.ip));
            user.tokenGeneratedTimestamp = Date.now();

            await User.saveDoc(user);

            res.send({ token });
        } catch (err) {
            res.status(500).send(err);
        }
    });

router.route('/logout')
    .delete(async (req, res) => {
        try {
            let user = await User.authenticateRequest(req);

            user.hashedTokenAndIp = null;
            user.tokenGeneratedTimestamp = null;

            user = await User.saveDoc(user);

            res.send({ message: `Logged out of ${user.email}.` });
        } catch (err) {
            res.status(500).send(err);
        }
    });

router.route('/authenticate')
    .put(async (req, res) => {
        try {
            let user = await User.findByEmail(req.query.email);
            if (user === null) throw `email (${req.query.email}) does not exist.`;

            if (!user.pendingPasswordChangeAuthentication() && !user.pendingRegistrationAuthentication()) {
                res.send(`user (${user.email}) is not pending authentication.`);
                return;
            }

            user.assertAuthenticationMatches(req.query.authentication);

            if (user.pendingPasswordChangeAuthentication()) user.hashedPassword = user.hashedNewPassword;

            user.hashedAuthentication = null;
            user.hashedNewPassword = null;

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

            user.assertRegistrationAuthenticated();

            const authentication = User.generateAuthCode();

            user.hashedAuthentication = user.hash(authentication);
            user.hashedNewPassword = user.hash(req.query.newPassword);

            user = await User.saveDoc(user);

            await Mailer.sendPasswordChangeMail(user, authentication);

            res.send({ user });
        } catch (err) {
            res.status(500).send(err);
        }
    });

router.route('/regenerateAuthenticationCode')
    .put(async (req, res) => {
        try {
            let user = await User.findByEmail(req.query.email);
            if (user === null) throw `email (${req.query.email}) does not exist.`;

            if (!user.pendingRegistrationAuthentication() && !user.pendingPasswordChangeAuthentication()) {
                res.send(`user (${user.email}) is not pending authentication.`);
                return;
            }

            const authentication = User.generateAuthCode();
            user.hashedAuthentication = user.hash(authentication);
            user = await User.saveDoc(user);

            if (user.pendingRegistrationAuthentication()) await Mailer.sendRegistrationMail(user, authentication);
            else if (user.pendingPasswordChangeAuthentication()) await Mailer.sendPasswordChangeMail(user, authentication);

            res.send({ user });
        } catch (err) {
            res.status(500).send(err);
        }
    });

module.exports = router;
