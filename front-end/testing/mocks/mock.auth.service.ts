import { AuthService } from '../../src/app/services/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import User from 'src/app/models/user';

export class MockAuthService extends AuthService {
    private p: string;
    private u: User;

    constructor() {
        super(null, null);
    }

    get password(): string {
        return this.p;
    }

    get user(): User {
        return this.u;
    }

    async login(email: string, password: string): Promise<User> {
        this.p = password;
        this.u = new User({ email, hashedPassword: `${password} (hashed)`, firstName: 'First Name' });

        return this.user;
    }

    async logout(): Promise<void> {
        this.p = null;
        this.u = null;
    }

    async register(firstName: string, lastName: string, email: string, password: string): Promise<User> {
        return new User({ firstName, lastName, email, password: `${password} (hashed)` });
    }
}