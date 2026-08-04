import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TrilhasService } from './trilhas.service';

describe('TrilhasService', () => {
  let service: TrilhasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TrilhasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve consultar a listagem de trilhas publicadas', () => {
    service.listarPublicadas().subscribe();

    const requisicao = httpMock.expectOne('/api/trilhas');
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush([]);
  });

  it('deve consultar o detalhe da trilha', () => {
    service.buscarDetalhe('trilha-1').subscribe();

    const requisicao = httpMock.expectOne('/api/trilhas/trilha-1');
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush({});
  });

  it('deve consultar progresso da trilha', () => {
    service.buscarProgresso('trilha-1').subscribe();

    const requisicao = httpMock.expectOne('/api/trilhas/trilha-1/progresso');
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush({});
  });

  it('deve consultar o conteúdo da lição', () => {
    service.buscarLicao('trilha-1', 'licao-1').subscribe();

    const requisicao = httpMock.expectOne(
      '/api/trilhas/trilha-1/licoes/licao-1',
    );
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush({});
  });

  it('deve registrar conclusão de lição com tempo de estudo', () => {
    service.concluirLicao('trilha-1', 'licao-1', 120).subscribe();

    const requisicao = httpMock.expectOne(
      '/api/trilhas/trilha-1/licoes/licao-1/concluir',
    );
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({ tempoEstudoSegundos: 120 });
    requisicao.flush({});
  });
});
