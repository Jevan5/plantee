class ErrorMessage {
    static codes = {
        UNAUTHORIZED: 401,
        NOT_FOUND: 404,
        NOT_ACCEPTABLE: 406,
        SERVER_ERROR: 500
    };

    constructor(dev, user, code) {
        this._dev = dev;
        this._user = user;
        this._code = code;
    }

    get dev() {
        return this._dev;
    }

    get user() {
        return this._user;
    }

    get code() {
        return this._code;
    }

    static createWithUser(user, dev, code) {
        return new ErrorMessage(dev, user, code);
    }

    static create(message, code) {
        return ErrorMessage.createWithUser(message, message, code);
    }

    static throwWithUser(user, dev, code) {
        throw ErrorMessage.createWithUser(user, dev, code);
    }

    static throw(message, code) {
        throw ErrorMessage.create(message, code);
    }
}

module.exports = ErrorMessage;
