const crypto = require('crypto');

class CryptoHelper {
    static get keyLength() {
        return 64;
    }

    static get minSecureLength() {
        return 16;
    }

    static get authenticationLength() {
        return 6;
    }

    static generateRandomString(length = CryptoHelper.minSecureLength) {
        return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, CryptoHelper.minSecureLength);
    }

    static hash(plaintext, salt) {
        return crypto.pbkdf2Sync(plaintext, salt, 10000, CryptoHelper.keyLength, 'sha512').toString('hex');
    }

    static hashEquals(plaintext, salt, hash) {
        return CryptoHelper.hash(plaintext, salt) === hash;
    }
}

module.exports = CryptoHelper;
