import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EstatisticasService } from './estatisticas.service';

describe('EstatisticasService', () => {
  let service: EstatisticasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(EstatisticasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve registrar acesso autenticado', () => {
    service.registrarAcesso().subscribe();

    const requisicao = httpMock.expectOne('/api/estatisticas/acessos');
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({});
    requisicao.flush(null);
  });

  it('deve consultar estatísticas agregadas com filtros', () => {
    const inicio = new Date('2026-06-01T00:00:00.000Z');
    const fim = new Date('2026-07-01T00:00:00.000Z');

    service
      .consultarAgregado({ inicio, fim, agrupamento: 'semana' })
      .subscribe();

    const requisicao = httpMock.expectOne(
      (req) =>
        req.url === '/api/estatisticas/uso/agregado' &&
        req.params.get('inicio') === inicio.toISOString() &&
        req.params.get('fim') === fim.toISOString() &&
        req.params.get('agrupamento') === 'semana',
    );
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush([]);
  });

  it('deve exportar estatísticas agregadas em CSV', () => {
    const inicio = new Date('2026-06-01T00:00:00.000Z');
    const fim = new Date('2026-07-01T00:00:00.000Z');

    service.exportarCsv({ inicio, fim, agrupamento: 'mes' }).subscribe();

    const requisicao = httpMock.expectOne(
      (req) =>
        req.url === '/api/estatisticas/exportacao.csv' &&
        req.params.get('inicio') === inicio.toISOString() &&
        req.params.get('fim') === fim.toISOString() &&
        req.params.get('agrupamento') === 'mes',
    );
    expect(requisicao.request.method).toBe('GET');
    expect(requisicao.request.responseType).toBe('blob');
    requisicao.flush(new Blob(['periodo_inicio,periodo_fim,metrica,valor']));
  });
});
