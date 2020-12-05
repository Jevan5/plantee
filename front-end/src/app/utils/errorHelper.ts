export default class ErrorHelper {
    private static get unknownErrorMessage() {
        return 'An unknown error has occurred. Please contact plantee.info@gmail.com';
    }

    static getUserMessageFromError(error): string {
        return ErrorHelper.getMessageFromError(error, false);
    }

    static getDevMessageFromError(error): string {
        return ErrorHelper.getMessageFromError(error, true);
    }

    private static getMessageFromError(error, isDev): string {
        const prefix = isDev ? '_dev' : '_user';
        if (error === null || error === undefined) return ErrorHelper.unknownErrorMessage;
        if (error.hasOwnProperty('error')) error = error.error;
        if (error[prefix] !== undefined) return error[prefix];
        else if (ErrorHelper.parseMongoError(error) !== null) return ErrorHelper.parseMongoError(error);
        else if (error['message'] !== undefined) return error.message;
        else if (typeof(error) === 'string') return error;
        else return isDev ? error : ErrorHelper.parseMongoError(error);
    }

    private static parseMongoError(error): string {
        if (error.name === 'MongoError') {
            if (error.code === 11000) { // Duplicate
                const keys = Object.keys(error.keyPattern);

                if (keys.length === 1) {
                    const key = keys[0];
                    return `${ErrorHelper.readableKey(key)} (${error.keyValue[key]}) already exists.`;
                } else if (keys.length === 2) {
                    const userIdIndex = keys.indexOf('_userId');
                    if (userIdIndex < 0) return null;

                    const otherKey = keys[userIdIndex === 0 ? 1 : 0];
                    return `${ErrorHelper.readableKey(otherKey)} (${error.keyValue[otherKey]}) already exists.`;
                }
            }
        }

        if (error.errors) {
            const errors = [];
            const keys = Object.keys(error.errors);

            keys.forEach((key) => {
                const err = error.errors[key];
                if (err.kind === 'min') {
                    const message = err.message;
                    const prefix = 'is less than minimum allowed value (';
                    const indexOfValue = message.indexOf(prefix) + prefix.length;
                    const indexOfSecondParenthesis = message.indexOf(')', indexOfValue);
                    const min = Number.parseFloat(message.substr(indexOfValue, indexOfSecondParenthesis - indexOfValue));

                    errors.push(`${ErrorHelper.readableKey(key)} (${err.value}) must be at least ${min}`);
                }
            });

            return errors.join('. ');
        }

        return null;
    }

    private static readableKey(camelCaseKey: string): string {
        const words = [];

        let startOfWordIndex = 0;
        for (let i = 0; i < camelCaseKey.length; i++) {
            if (ErrorHelper.isUpperCaseChar(camelCaseKey.charAt(i))) {
                const word = camelCaseKey.substr(startOfWordIndex, i - startOfWordIndex);
                startOfWordIndex = i;

                words.push(word.toLowerCase());
            }
        }

        words.push(camelCaseKey.substr(startOfWordIndex).toLowerCase());

        return words.join(' ');
    }

    private static isUpperCaseChar(char: string): boolean {
        const c = char.charAt(0);

        return c === c.toUpperCase() && c !== c.toLowerCase();
    }

    static logDevMessageAndThrowUserMessageFromError(error): void {
        console.log(ErrorHelper.getDevMessageFromError(error));
        throw ErrorHelper.getUserMessageFromError(error);
    }
}