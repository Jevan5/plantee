import Document from './document';

export default class User extends Document {
    static readonly nameForSingle = 'user';
    static readonly routeName = 'users';

    public disabled: boolean;
    public email: string;
    public firstName: string;
    public hashedAuthentication: string;
    public hashedNewPassword: string;
    public hashedPassword: string;
    public lastName: string;
    public salt: string;
};