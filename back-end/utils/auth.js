const CryptoHelper = require('./cryptoHelper');
const ErrorMessage = require('./errorMessage');
const User = require('../models/user/user');

class Auth {
    static get delimeter() {
        return ':';
    }

    static get errors() {
        return {
            AUTHORIZATION_HEADER: 'Invalid authorization header configuration',
            NOT_AUTHORIZED: 'Not authorized'
        };
    }

    static get header() {
        return 'Authorization';
    }

    static async authenticateRequest(request) {
        if(request.header(Auth.header) == null) throw ErrorMessage.createWithUser(Auth.errors.AUTHORIZATION_HEADER, `Missing header: "${Auth.header}"`, ErrorMessage.codes.UNAUTHORIZED);

        const authorization = request.header(Auth.header);

        let index = authorization.indexOf(Auth.delimeter);
        if (index < 0) throw ErrorMessage.createWithUser(Auth.errors.AUTHORIZATION_HEADER, `Missing "${Auth.delimeter}" from "${Auth.header}" header: "<email>${Auth.delimeter}<password>"`);

        const email = authorization.substring(0, index);
        const password = authorization.substring(index + this.delimeter.length);

        const user = await User.findOne({ email: email });
        if (user == null) throw ErrorMessage.create(`Email (${email}) does not exist.`, ErrorMessage.codes.NOT_FOUND);

        if (user.disabled) throw ErrorMessage.create(`User (${email}) is disabled.`, ErrorMessage.codes.UNAUTHORIZED);

        if (user.hashedAuthentication) throw ErrorMessage.create(`User (${email}) has not yet authenticated.`);

        if (!CryptoHelper.hashEquals(password, user.salt, user.hashedPassword)) throw ErrorMessage.create(`Invalid password for user ${email}.`, ErrorMessage.codes.UNAUTHORIZED);

        return user;
    }

    static valueForHeader(email, password) {
        return `${email}${Auth.delimeter}${password}`;
    }

    static idMatches(id, otherId) {
        return id.toString().toLowerCase() === otherId.toString().toLowerCase();
    }

    static assertIdMatches(id, otherId) {
        if (!Auth.idMatches(id, otherId)) throw ErrorMessage.create(Auth.errors.NOT_AUTHORIZED, ErrorMessage.codes.UNAUTHORIZED);
    }
}

module.exports = Auth;
