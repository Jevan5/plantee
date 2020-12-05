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
  private _token: string;
  private _user: User;

  constructor(
    private http: HttpClient,
    private localStorage: LocalStorageService
  ) {
    this._token = null;
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

  get token(): string {
    return this._token;
  }

  get user(): User {
    return this._user;
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const res: any = await this.http.post(`${environment.backEnd.url}:${environment.backEnd.port}/${User.routeName}/login`,
      {},
      {
        headers: AuthService.getAuthorizationHeaderWithoutUser(email, password)
      }).toPromise();

      const t = res.token;

      await this.refreshUser(email, t);

      await this.localStorage.set('email', this.user.email);
      await this.localStorage.set('token', this.token);

      return this.user;
    } catch (err) {
      ErrorHelper.logDevMessageAndThrowUserMessageFromError(err);
    }
  }

  async loginFromStorage(): Promise<User> {
    try {
      const email = await this.localStorage.get('email');
      const token = await this.localStorage.get('token');

      if (!email || !token) throw 'No login credentials are stored.';

      return this.refreshUser(email, token);
    } catch (err) {
      ErrorHelper.logDevMessageAndThrowUserMessageFromError(err);
    }
  }
  
  private static getAuthorizationHeaderWithoutUser(email: string, secret: string): HttpHeaders {
    const headers = {};
    headers[AuthService.header] = `${email}${AuthService.delimeter}${secret}`;

    return new HttpHeaders(headers);
  }

  getAuthorizationHeader(): HttpHeaders {
    if (!this.loggedIn) throw 'Not logged in.';

    return AuthService.getAuthorizationHeaderWithoutUser(this.user.email, this.token);
  }

  async logout(): Promise<void> {
    try {
      await this.http.delete(`${environment.backEnd.url}:${environment.backEnd.port}/${User.routeName}/logout`, {
        headers: this.getAuthorizationHeader()
      }).toPromise();
      this._token = null;
      this._user = null;
      await this.localStorage.remove('email');
      await this.localStorage.remove('token');
    } catch (err) {
      ErrorHelper.logDevMessageAndThrowUserMessageFromError(err);
    }
  }

  private async refreshUser(email: string, token: string): Promise<User> {
    const res: any = await this.http.get(`${environment.backEnd.url}:${environment.backEnd.port}/${User.routeName}`, {
      headers: AuthService.getAuthorizationHeaderWithoutUser(email, token)
    }).toPromise();

    this._token = token;
    this._user = new User(res[User.nameForSingle]);

    return this.user;
  }

  async register(firstName: string, lastName: string, email: string, password: string): Promise<User> {
    try {
      const res: any = await this.http.post(`${environment.backEnd.url}:${environment.backEnd.port}/${User.routeName}`, {
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

  async authenticate(email: string, authentication: string): Promise<void> {
    try {
      await this.http.put(`${environment.backEnd.url}:${environment.backEnd.port}/${User.routeName}/authenticate?email=${email}&authentication=${authentication}`, {}).toPromise();
    } catch (err) {
      ErrorHelper.logDevMessageAndThrowUserMessageFromError(err);
    }
  }

  async regenerateAuthenticationCode(email: string): Promise<void> {
    try {
      await this.http.put(`${environment.backEnd.url}:${environment.backEnd.port}/${User.routeName}/regenerateAuthenticationCode?email=${email}`, {}).toPromise();
    } catch (err) {
      ErrorHelper.logDevMessageAndThrowUserMessageFromError(err);
    }
  }

  async changePassword(email: string, newPassword: string): Promise<void> {
    try {
      await this.http.put(`${environment.backEnd.url}:${environment.backEnd.port}/users/changePassword?email=${email}&newPassword=${newPassword}`, {}).toPromise();
    } catch (err) {
      ErrorHelper.logDevMessageAndThrowUserMessageFromError(err);
    }
  }
}