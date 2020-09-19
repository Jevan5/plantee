import { TestBed } from '@angular/core/testing';

import { DocumentService } from './document.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DocService', () => {
  let service: DocumentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(DocumentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
