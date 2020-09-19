import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RegisterPage } from './register.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { MockResponsiveService } from 'testing/mocks/mock.responsive.service';
import { MockAuthService } from 'testing/mocks/mock.auth.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ResponsiveService } from 'src/app/services/responsive/responsive.service';

describe('RegisterPage', () => {
  const error = 'some error';
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;
  let mockResponsive: MockResponsiveService;
  let mockResponsiveSetLoadingMessageSpy: jasmine.Spy<any>;
  let mockResponsiveSetSuccessMessageSpy: jasmine.Spy<any>;
  let mockResponsiveSetErrorMessageSpy: jasmine.Spy<any>;
  let mockAuth: MockAuthService;
  let mockAuthRegisterSpy: jasmine.Spy<any>;
  const email = 'something@something.ca';
  const password = 'password123';
  const repeatPassword = password;
  const firstName = 'John';
  const lastName = 'Jacob';

  beforeEach(async(() => {
    mockResponsive = new MockResponsiveService();
    mockResponsiveSetLoadingMessageSpy = spyOn(mockResponsive, 'setLoadingMessage').and.callThrough();
    mockResponsiveSetSuccessMessageSpy = spyOn(mockResponsive, 'setSuccessMessage').and.callThrough();
    mockResponsiveSetErrorMessageSpy = spyOn(mockResponsive, 'setErrorMessage').and.callThrough();
    mockAuth = new MockAuthService();
    mockAuthRegisterSpy = spyOn(mockAuth, 'register').and.callThrough();

    TestBed.configureTestingModule({
      declarations: [ RegisterPage ],
      imports: [IonicModule.forRoot(), HttpClientTestingModule, FormsModule, RouterTestingModule],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuth
        },
        {
          provide: ResponsiveService,
          useValue: mockResponsive
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should register', async () => {
    component['email'] = email;
    component['firstName'] = firstName;
    component['lastName'] = lastName;
    component['password'] = password;
    component['repeatPassword'] = repeatPassword;
    await component.register();

    expect(mockResponsiveSetLoadingMessageSpy).toHaveBeenCalledWith('Registering');
    expect(mockAuthRegisterSpy).toHaveBeenCalledWith(firstName, lastName, email, password);
    expect(mockResponsiveSetSuccessMessageSpy).toHaveBeenCalledWith(`Please check ${email} for an authentication link.`);
    expect(mockResponsiveSetErrorMessageSpy).not.toHaveBeenCalled();
  });

  it("should display an error when the passwords don't match", async () => {
    const mismatchedPassword = repeatPassword.toUpperCase();

    component['email'] = email;
    component['firstName'] = firstName;
    component['lastName'] = lastName;
    component['password'] = password;
    component['repeatPassword'] = mismatchedPassword;
    await component.register();

    expect(mockResponsiveSetLoadingMessageSpy).not.toHaveBeenCalled();
    expect(mockAuthRegisterSpy).not.toHaveBeenCalled();
    expect(mockResponsiveSetSuccessMessageSpy).not.toHaveBeenCalled();
    expect(mockResponsiveSetErrorMessageSpy).toHaveBeenCalledWith("Passwords don't match.");
  });

  it('should display an error when AuthService.register() throws an error', async () => {
    mockAuthRegisterSpy.and.throwError(error);

    component['email'] = email;
    component['firstName'] = firstName;
    component['lastName'] = lastName;
    component['password'] = password;
    component['repeatPassword'] = repeatPassword;
    await component.register();

    expect(mockResponsiveSetLoadingMessageSpy).toHaveBeenCalledWith('Registering');
    expect(mockAuthRegisterSpy).toHaveBeenCalledWith(firstName, lastName, email, password);
    expect(mockResponsiveSetSuccessMessageSpy).not.toHaveBeenCalled();
    expect(mockResponsiveSetErrorMessageSpy).toHaveBeenCalledWith(new Error(error));
  });
});
