import { Injectable } from '@angular/core';
import ErrorHelper from '../../utils/errorHelper';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import User from '../../models/user';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from '../local-storage/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _password: string;
  private _user: User;

  constructor(
    private http: HttpClient,
    private localStorage: LocalStorageService
  ) {
    this._password = null;
    this._user = null;
  }

  static get delimeter(): string {
    return ':';
  }

  static get header(): string {
    return 'Authorization';
  }

  get loggedIn(): boolean {
    return this.user !== null;
  }

  get password(): string {
    return this._password;
  }

  get user(): User {
    return this._user;
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const res: any = await this.http.get(`${environment.backEnd.url}:${environment.backEnd.port}/${User.nameForMultiple}/login`,
      {
        headers: AuthService.getAuthorizationHeaderWithoutUser(email, password)
      }).toPromise();

      this._password = password;
      this._user = new User(res[User.nameForSingle]);

      await this.localStorage.set('email', this.user.email);
      await this.localStorage.set('password', this.password);

      return this.user;
    } catch (err) {
      ErrorHelper.logDevMessageAndThrowUserMessageFromError(err);
    }
  }

  async loginFromStorage(): Promise<User> {
    try {
      const email = await this.localStorage.get('email');
      const password = await this.localStorage.get('password');

      if (!email || !password) throw 'No login credentials are stored.';

      return this.login(email, password);
    } catch (err) {
      ErrorHelper.logDevMessageAndThrowUserMessageFromError(err);
    }
  }
  
  private static getAuthorizationHeaderWithoutUser(email: string, password: string): HttpHeaders {
    const headers = {};
    headers[AuthService.header] = `${email}${AuthService.delimeter}${password}`;

    return new HttpHeaders(headers);
  }

  getAuthorizationHeader(): HttpHeaders {
    if (!this.loggedIn) throw 'Not logged in.';

    return AuthService.getAuthorizationHeaderWithoutUser(this.user.email, this.password);
  }

  async logout(): Promise<void> {
    this._password = null;
    this._user = null;

    try {
      await this.localStorage.remove('email');
      await this.localStorage.remove('password');
    } catch (err) {
      ErrorHelper.logDevMessageAndThrowUserMessageFromError(err);
    }
  }

  async register(firstName: string, lastName: string, email: string, password: string): Promise<User> {
    try {
      const res: any = await this.http.post(`${environment.backEnd.url}:${environment.backEnd.port}/${User.nameForMultiple}`, {
        user: {
          firstName,
          lastName,
          email,
          password
        }
      }).toPromise();

      return new User(res[User.nameForSingle]);
    } catch (err) {
      ErrorHelper.logDevMessageAndThrowUserMessageFromError(err);
    }
  }
}
