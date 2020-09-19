import { TestBed } from '@angular/core/testing';

import { ResponsiveService } from './responsive.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('ResponsiveService', () => {
  let service: ResponsiveService;
  let loadingControllerCreateSpy: jasmine.Spy<any>;
  let toastControllerCreateSpy: jasmine.Spy<any>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule]
    });
    service = TestBed.inject(ResponsiveService);

    loadingControllerCreateSpy = spyOn(service['loadingController'], 'create');
    loadingControllerCreateSpy.and.returnValue({
      dismiss: () => new Promise((resolve) => resolve()),
      present: () => new Promise((resolve) => resolve())
    });

    toastControllerCreateSpy = spyOn(service['toastController'], 'create');
    toastControllerCreateSpy.and.returnValue({
      dismiss: () => new Promise((resolve) => resolve()),
      present: () => new Promise((resolve) => resolve())
    })
  });

  afterEach(async () => {
    await service.stopLoading();
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have a duration of 3000', () => {
    expect(service.duration).toEqual(3000);
  });

  it('should not be loading by default', () => {
    expect(service.loading).toBeFalse();
  });

  it('should be loading once a loading message has been set', async () => {
    await service.setLoadingMessage();
    expect(service.loading).toBeTrue();
  });

  it('should not be loading after the loading has been stopped', async () => {
    await service.setLoadingMessage();
    await service.stopLoading();
    expect(service.loading).toBeFalse();
  });

  it('should not be loading after a success message has been set', async () => {
    await service.setLoadingMessage();
    await service.setSuccessMessage('success message');
    expect(service.loading).toBeFalse();
  });

  it('should not be loading after a warning message has been set', async() => {
    await service.setLoadingMessage();
    await service.setWarningMessage('warning message');
    expect(service.loading).toBeFalse();
  });

  it('should not be loading after an error message has been set', async () => {
    await service.setLoadingMessage();
    await service.setErrorMessage('error message');
    expect(service.loading).toBeFalse();
  });
});
