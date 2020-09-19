import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoginPage } from './login.page';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ResponsiveService } from 'src/app/services/responsive/responsive.service';
import { MockResponsiveService } from 'testing/mocks/mock.responsive.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { MockAuthService } from 'testing/mocks/mock.auth.service';
import { Router } from '@angular/router';
import { DummyComponent } from 'testing/mocks/dummy/dummy.component';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let mockResponsive: MockResponsiveService;
  let mockResponsiveSetLoadingMessageSpy: jasmine.Spy<never>;
  let mockResponsiveSetSuccessMessageSpy: jasmine.Spy<never>;
  let mockResponsiveSetErrorMessageSpy: jasmine.Spy<never>;
  let mockAuth: MockAuthService;
  let mockAuthLoginSpy: jasmine.Spy<never>;
  let router;
  let routerNavigateByUrlSpy: jasmine.Spy<any>;
  const email = 'something@something.ca';
  const password = 'password123';

  beforeEach(async(() => {
    mockResponsive = new MockResponsiveService();
    mockResponsiveSetLoadingMessageSpy = spyOn(mockResponsive, 'setLoadingMessage').and.callThrough();
    mockResponsiveSetSuccessMessageSpy = spyOn(mockResponsive, 'setSuccessMessage').and.callThrough();
    mockResponsiveSetErrorMessageSpy = spyOn(mockResponsive, 'setErrorMessage').and.callThrough();
    mockAuth = new MockAuthService();
    mockAuthLoginSpy = spyOn(mockAuth, 'login').and.callThrough();

    TestBed.configureTestingModule({
      declarations: [LoginPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule, FormsModule, RouterTestingModule.withRoutes([
        {
          path: 'owned-plants',
          component: DummyComponent
        }
      ])],
      providers: [
        {
          provide: ResponsiveService,
          useValue: mockResponsive
        },
        {
          provide: AuthService,
          useValue: mockAuth
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    router = TestBed.get(Router);
    routerNavigateByUrlSpy = spyOn(router, 'navigateByUrl').and.callThrough();
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should login', async () => {
    component['email'] = email;
    component['password'] = password;
    await component.login();

    expect(mockResponsive.setLoadingMessage).toHaveBeenCalledWith('Logging in');
    expect(mockAuth.login).toHaveBeenCalled();
    expect(mockResponsive.setSuccessMessage).toHaveBeenCalledWith(`Welcome back, ${mockAuth.user.firstName}.`);
    expect(routerNavigateByUrlSpy).toHaveBeenCalledWith('/owned-plants')
    expect(mockResponsiveSetErrorMessageSpy).not.toHaveBeenCalled();
  });

  it('should display error when AuthService.login() throws an error', async () => {
    const error = 'something went wrong.';
    mockAuthLoginSpy.and.throwError(error);

    component['email'] = email;
    component['password'] = password;
    await component.login();

    expect(mockResponsive.setLoadingMessage).toHaveBeenCalledWith('Logging in');
    expect(mockAuth.login).toHaveBeenCalled();
    expect(mockResponsive.setSuccessMessage).not.toHaveBeenCalled();
    expect(routerNavigateByUrlSpy).not.toHaveBeenCalled();
    expect(mockResponsive.setErrorMessage).toHaveBeenCalledWith(new Error(error));
  });
});
