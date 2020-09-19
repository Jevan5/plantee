export default class ErrorHelper {
    static getUserMessageFromError(error): string {
        return ErrorHelper.getMessageFromError(error, false);
    }

    static getDevMessageFromError(error): string {
        return ErrorHelper.getMessageFromError(error, true);
    }

    private static getMessageFromError(error, isDev): string {
        const prefix = isDev ? '_dev' : '_user';
        if (error.hasOwnProperty('error')) error = error.error;
        if (error[prefix] !== undefined) return error[prefix];
        else if (error['message'] !== undefined) return error.message;
        else return isDev ? error : 'An error has occurred.';
    }

    static logDevMessageAndThrowUserMessageFromError(error): void {
        console.log(ErrorHelper.getDevMessageFromError(error));
        throw ErrorHelper.getUserMessageFromError(error);
    }
}