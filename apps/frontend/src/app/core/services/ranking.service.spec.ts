import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RankingService } from './ranking.service';

describe('RankingService', () => {
  let service: RankingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(RankingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve consultar ranking geral', () => {
    service.listarGeral().subscribe();

    const requisicao = httpMock.expectOne('/api/ranking/geral');
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush(criarResposta('geral'));
  });

  it('deve consultar ranking semanal', () => {
    service.listarSemanal().subscribe();

    const requisicao = httpMock.expectOne('/api/ranking/semanal');
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush(criarResposta('semanal'));
  });
});

function criarResposta(tipo: 'geral' | 'semanal') {
  return {
    tipo,
    limite: 50,
    periodo:
      tipo === 'semanal'
        ? {
            inicio: new Date('2026-06-08T03:00:00.000Z'),
            fimExclusivo: new Date('2026-06-15T03:00:00.000Z'),
          }
        : null,
    entradas: [],
    minhaEntrada: null,
  };
}
