const crypto = require('crypto');

class CryptoHelper {
    static get keyLength() {
        return 64;
    }

    static generateRandomString(length) {
        return crypto.randomBytes(length).toString('hex').slice(0, length);
    }

    static generateAuthCode() {
        return CryptoHelper.generateRandomString(CryptoHelper.authenticationLength).toUpperCase();
    }

    static hash(plaintext, salt) {
        return crypto.pbkdf2Sync(plaintext, salt, 10000, CryptoHelper.keyLength, 'sha512').toString('hex');
    }

    static hashEquals(plaintext, salt, hash) {
        return CryptoHelper.hash(plaintext, salt) === hash;
    }
}

module.exports = CryptoHelper;
