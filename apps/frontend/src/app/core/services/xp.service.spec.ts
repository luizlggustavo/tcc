import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { XpService } from './xp.service';

describe('XpService', () => {
  let service: XpService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(XpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve consultar histórico de XP sem filtros', () => {
    service.listarHistorico().subscribe();

    const requisicao = httpMock.expectOne('/api/xp/historico');
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush([]);
  });

  it('deve consultar histórico de XP com período', () => {
    const inicio = new Date('2026-06-01T00:00:00.000Z');
    const fim = new Date('2026-06-05T23:59:59.000Z');

    service.listarHistorico({ inicio, fim }).subscribe();

    const requisicao = httpMock.expectOne(
      (req) =>
        req.url === '/api/xp/historico' &&
        req.params.get('inicio') === inicio.toISOString() &&
        req.params.get('fim') === fim.toISOString(),
    );
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush([]);
  });
});
