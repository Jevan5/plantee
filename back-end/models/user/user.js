const CryptoHelper = require('../../utils/cryptoHelper');
const ErrorMessage = require('../../utils/errorMessage');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const SchemaValidator = require('../../utils/schemaValidator');

const userSchema = new Schema({
    disabled: { type: Boolean, required: true },
    email: { type: String, lowercase: true, trim: true, required: true },
    firstName: { type: String, required: true },
    hashedAuthentication: { type: String },
    hashedNewPassword: { type: String },
    hashedPassword: { type: String, required: true },
    hashedTokenAndIp: { type: String },
    lastName: { type: String, required: true },
    salt: { type: String, required: true },
    tokenGeneratedTimestamp: { type: Date }
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ hashedToken: 1}, { unique: false });

userSchema.pre('save', async function() {
    SchemaValidator.assertDefined(this, 'hashedAuthentication');
    SchemaValidator.assertDefined(this, 'hashedNewPassword');
    SchemaValidator.assertDefined(this, 'hashedTokenAndIp');
    SchemaValidator.assertDefined(this, 'tokenGeneratedTimestamp');
});

let User;

userSchema.methods.assertAuthenticationMatches = function (authentication) {
    if (!this.authenticationMatches(authentication)) ErrorMessage.throw(`Authentication (${authentication}) is incorrect.`, ErrorMessage.codes.UNAUTHORIZED);
};

userSchema.methods.assertPasswordMatches = function (password) {
    if (!this.passwordMatches(password)) ErrorMessage.throw(`Password for user (${this.email}) is incorrect.`, ErrorMessage.codes.UNAUTHORIZED);
};

userSchema.methods.assertRegistrationAuthenticated = function () {
    if (this.pendingRegistrationAuthentication()) ErrorMessage.throw(`User (${this.email}) has not yet authenticated their account.`, ErrorMessage.codes.UNAUTHORIZED);
};

userSchema.methods.assertTokenAndIpMatches = function (token, ip) {
    if (!this.tokenAndIpMatches(token, ip)) ErrorMessage.throw(`Invalid token and/or IP for user (${this.email}).`, ErrorMessage.codes.UNAUTHORIZED);
};

userSchema.methods.assertTokenStillValid = function () {
    if (!this.tokenStillValid()) ErrorMessage.throw(`User's (${this.email}) session is no longer valid.`, ErrorMessage.codes.UNAUTHORIZED);
};

userSchema.methods.authenticationMatches = function (authentication) {
    return CryptoHelper.hashEquals(authentication.toLowerCase().trim(), this.salt, this.hashedAuthentication);
};

userSchema.methods.hash = function (plaintext) {
    return CryptoHelper.hash(plaintext, this.salt);
};

userSchema.methods.passwordMatches = function (password) {
    return CryptoHelper.hashEquals(password, this.salt, this.hashedPassword);
};

userSchema.methods.pendingPasswordChangeAuthentication = function () {
    return this.hashedAuthentication !== null && this.hashedNewPassword !== null;
};

userSchema.methods.pendingRegistrationAuthentication = function () {
    return this.hashedAuthentication !== null && this.hashedNewPassword === null;
};

userSchema.methods.tokenAndIpMatches = function (token, ip) {
    return CryptoHelper.hashEquals(User.concatenateTokenAndIp(token, ip), this.salt, this.hashedTokenAndIp);
};

userSchema.methods.tokenStillValid = function () {
    if (this.tokenGeneratedTimestamp === null) return false;

    return this.tokenGeneratedTimestamp.getTime() >= Date.now() - User.tokenValidityDays() * 1000 * 60 * 60 * 24;
};

userSchema.statics.authCodeLength = function () {
    return 6;
};

userSchema.statics.authenticateLogin = async function (req) {
    const authorization = User.parseAuthorizationHeader(req);
    const email = User.parseEmailFromAuthorization(authorization);
    const password = User.parseSecretFromAuthorization(authorization);

    const user = await User.findByEmail(email);
    if (user == null) ErrorMessage.throw(`Email (${email}) does not exist.`, ErrorMessage.codes.NOT_FOUND);

    if (user.disabled) ErrorMessage.throw(`User (${email}) is disabled.`, ErrorMessage.codes.UNAUTHORIZED);

    user.assertPasswordMatches(password);

    user.assertRegistrationAuthenticated();

    return user;
};

userSchema.statics.authenticateRequest = async function (req) {
    const authorization = User.parseAuthorizationHeader(req);
    const email = User.parseEmailFromAuthorization(authorization);
    const token = User.parseSecretFromAuthorization(authorization);

    const user = await User.findByEmail(email);
    if (user == null) ErrorMessage.throw(`Email (${email}) does not exist.`, ErrorMessage.codes.NOT_FOUND);

    if (user.disabled) ErrorMessage.throw(`User (${email}) is disabled.`, ErrorMessage.codes.UNAUTHORIZED);

    user.assertTokenAndIpMatches(token, req.ip);

    user.assertTokenStillValid();

    user.assertRegistrationAuthenticated();

    return user;
};

userSchema.statics.concatenateTokenAndIp = function (token, ip) {
    return `${token}${ip}`;
};

userSchema.statics.delimeter = function () {
    return ':';
};

userSchema.statics.errors = function () {
    return {
        AUTHORIZATION_HEADER: 'Invalid authorization header configuration',
        NOT_AUTHORIZED: 'Not authorized'
    };
};

userSchema.statics.findByEmail = async function (email) {
    return await User.findOne({ email: email.toLowerCase().trim() });
};

userSchema.statics.header = function () {
    return 'Authorization';
};

userSchema.statics.parseAuthorizationHeader = function (req) {
    const authorization = req.header(User.header());
    if (authorization === undefined) ErrorMessage.throwWithUser(User.errors().AUTHORIZATION_HEADER, `Missing header: "${User.header()}"`, ErrorMessage.codes.UNAUTHORIZED);

    return authorization;
};

userSchema.statics.generateAuthCode = function () {
    return CryptoHelper.generateRandomString(User.authCodeLength());
};

userSchema.statics.generateSalt = function () {
    return CryptoHelper.generateRandomString(User.secureLength());
};

userSchema.statics.generateToken = function () {
    return CryptoHelper.generateRandomString(User.secureLength());
};

userSchema.statics.indexOfDelimeter = function (authorization) {
    return authorization.indexOf(User.delimeter());
};

userSchema.statics.parseEmailFromAuthorization = function (authorization) {
    const index = User.indexOfDelimeter(authorization);
    if (index < 0) ErrorMessage.throwWithUser(User.errors().AUTHORIZATION_HEADER, `Missing "${User.delimeter()}" from "${User.header()}" header: "<email>${User.delimeter()}<secret>"`, ErrorMessage.codes.UNAUTHORIZED);

    return authorization.substring(0, index);
};

userSchema.statics.parseSecretFromAuthorization = function (authorization) {
    const index = User.indexOfDelimeter(authorization);
    if (index < 0) ErrorMessage.throwWithUser(User.errors().AUTHORIZATION_HEADER, `Missing "${User.delimeter()}" from "${User.header()}" header: "<email>${User.delimeter()}<secret>"`, ErrorMessage.codes.UNAUTHORIZED);

    return authorization.substring(index + User.delimeter().length);
};

userSchema.statics.secureLength = function () {
    return 64;
};

userSchema.statics.saveDoc = async function (doc) {
    return new User(doc).save();
};

userSchema.statics.tokenValidityDays = function () {
    return 7;
};

userSchema.statics.valueForHeader = function (email, secret) {
    return `${email}${User.delimeter()}${secret}`;
};

User = mongoose.model('User', userSchema);

module.exports = User;
