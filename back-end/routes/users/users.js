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
            const authentication = CryptoHelper.generateRandomString();
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

            await Mailer.sendMail(user.email, 'Authenticate Account', `Please click the link below to complete your registration:\n\n${environment.api.url}:${environment.api.port}/users/${user._id}/${authentication}`);

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

router.route('/:_userId/:authentication')
    .get(async (req, res) => {
        try {
            const user = await User.findById(req.params._userId);
            if (user === null) throw `_userId (${req.params._userId}) does not exist.`;

            if (user.hashedAuthentication === '') {
                res.send(`user (${user.email}) is already authenticated.`);
                return;
            }

            if (!CryptoHelper.hashEquals(req.params.authentication, user.salt, user.hashedAuthentication)) throw `authentication (${req.params.authentication}) is invalid.`;

            user.hashedAuthentication = '';

            await user.save();

            res.send(`user (${user.email}) has been authenticated.`);
        } catch (err) {
            res.status(500).send(err);
        }
    });

module.exports = router;
