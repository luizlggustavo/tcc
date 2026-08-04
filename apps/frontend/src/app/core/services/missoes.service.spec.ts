import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MissoesService } from './missoes.service';

describe('MissoesService', () => {
  let service: MissoesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(MissoesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve consultar missões sem filtro', () => {
    service.listar().subscribe();

    const requisicao = httpMock.expectOne('/api/missoes');
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush([]);
  });

  it('deve consultar missões filtradas por status', () => {
    service.listar('em_andamento').subscribe();

    const requisicao = httpMock.expectOne(
      (req) =>
        req.url === '/api/missoes' &&
        req.params.get('status') === 'em_andamento',
    );
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush([]);
  });

  it('deve iniciar missão', () => {
    service.iniciar('missao-1').subscribe();

    const requisicao = httpMock.expectOne('/api/missoes/missao-1/iniciar');
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({});
    requisicao.flush({});
  });

  it('deve concluir missão', () => {
    service.concluir('missao-1').subscribe();

    const requisicao = httpMock.expectOne('/api/missoes/missao-1/concluir');
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({});
    requisicao.flush({});
  });
});
