import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpHeaders } from '@angular/common/http';
import User from 'src/app/models/user';
import ErrorHelper from 'src/app/utils/errorHelper';

describe('AuthService', () => {
  const error = 'some error';
  const password = 'some password';
  let service: AuthService;
  let userData;
  let httpGetSpy: jasmine.Spy<any>;
  let httpPostSpy: jasmine.Spy<any>;
  let errorHelperLogDevMessageAndThrowUserMessageFromErrorSpy: jasmine.Spy<any>;

  beforeEach(() => {
    userData = {
      email: 'something@something.com',
      hashedPassword: 'some hash',
      firstName: 'John',
      lastName: 'Jacob'
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpGetSpy = spyOn(service['http'], 'get');
    httpPostSpy = spyOn(service['http'], 'post');
    errorHelperLogDevMessageAndThrowUserMessageFromErrorSpy = spyOn(ErrorHelper, 'logDevMessageAndThrowUserMessageFromError');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it("should return ':' as the delimeter", async () => {
    expect(AuthService.delimeter).toEqual(':');
  });

  it("should return 'Authorization' as the header", async () => {
    expect(AuthService.header).toEqual('Authorization');
  });

  it('should not be logged in by default', async () => {
    expect(service.loggedIn).toBeFalse();
    expect(service.user).toBeNull();
  });

  it('should login', async () => {
    httpGetSpy.and.returnValue(new Observable((subscriber) => {
      subscriber.next({
        user: userData
      });
      subscriber.complete();
    }));

    const httpHeaders = <HttpHeaders><unknown>'the http headers';

    const authServiceGetAuthorizationHeaderWithoutUserSpy = spyOn<any>(AuthService, 'getAuthorizationHeaderWithoutUser').and.returnValue(httpHeaders);

    const user = await service.login(userData.email, password);

    expect(httpGetSpy.calls.count()).toEqual(1);
    expect(httpGetSpy.calls.first().args[0]).toEqual(`${environment.backEnd.url}:${environment.backEnd.port}/users/login`);
    expect((<any>httpGetSpy.calls.first().args[1]).headers).toEqual(httpHeaders);
    expect(authServiceGetAuthorizationHeaderWithoutUserSpy).toHaveBeenCalledWith(userData.email, password);
    expect(service.password).toEqual(password);
    expect(service.user).toEqual(new User(userData));
    expect(service.user).toEqual(user);
    expect(service.loggedIn).toBeTrue();
  });

  it('should throw error when HttpClient.get() throws an error', async () => {
    httpGetSpy.and.throwError(error);

    await service.login(userData.email, password);

    expect(service.user).toBeNull();
    expect(service.loggedIn).toBeFalse();
    expect(errorHelperLogDevMessageAndThrowUserMessageFromErrorSpy).toHaveBeenCalledWith(new Error(error));
  });

  it('should register', async () => {
    httpPostSpy.and.returnValue(new Observable((subscriber) => {
      subscriber.next({
        user: userData
      });
      subscriber.complete();
    }));

    const user = await service.register(userData.firstName, userData.lastName, userData.email, password);

    expect(httpPostSpy).toHaveBeenCalledWith(`${environment.backEnd.url}:${environment.backEnd.port}/users`, {
      user: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password
      }
    });
    expect(user).toEqual(new User(userData));
    expect(errorHelperLogDevMessageAndThrowUserMessageFromErrorSpy).not.toHaveBeenCalled();
  });

  it('should throw error when HttpClient.post() throws an error', async () => {
    httpPostSpy.and.throwError(error);

    await service.register(userData.firstName, userData.lastName, userData.email, password);

    expect(errorHelperLogDevMessageAndThrowUserMessageFromErrorSpy).toHaveBeenCalledWith(new Error(error));
  });
});
