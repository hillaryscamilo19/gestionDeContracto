import { TestBed } from '@angular/core/testing';

import { ContractoService } from './contracto.service';

describe('ContractoService', () => {
  let service: ContractoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContractoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
