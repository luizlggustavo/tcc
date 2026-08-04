import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConquistasService } from './conquistas.service';

describe('ConquistasService', () => {
  let service: ConquistasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ConquistasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve consultar conquistas do usuário', () => {
    service.listar().subscribe();

    const requisicao = httpMock.expectOne('/api/conquistas');
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush([]);
  });
});
