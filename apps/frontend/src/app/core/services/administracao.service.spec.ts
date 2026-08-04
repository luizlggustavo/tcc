import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdministracaoService } from './administracao.service';

describe('AdministracaoService', () => {
  let service: AdministracaoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AdministracaoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve consultar e atualizar usuários administrativos', () => {
    service.listarUsuarios().subscribe();
    const listagem = httpMock.expectOne('/api/admin/usuarios');
    expect(listagem.request.method).toBe('GET');
    listagem.flush([]);

    service
      .atualizarUsuario('usuario-1', {
        papel: 'administrador',
        status: 'ativo',
      })
      .subscribe();
    const atualizacao = httpMock.expectOne('/api/admin/usuarios/usuario-1');
    expect(atualizacao.request.method).toBe('PATCH');
    expect(atualizacao.request.body).toEqual({
      papel: 'administrador',
      status: 'ativo',
    });
    atualizacao.flush({});
  });

  it('deve manter categorias, trilhas, módulos, lições e conteúdos', () => {
    service.criarCategoria({ nome: 'Programação' }).subscribe();
    const categoria = httpMock.expectOne('/api/admin/categorias-trilhas');
    expect(categoria.request.method).toBe('POST');
    categoria.flush({});

    service.criarTrilha(criarTrilha()).subscribe();
    const trilha = httpMock.expectOne('/api/admin/trilhas');
    expect(trilha.request.method).toBe('POST');
    trilha.flush({});

    service.buscarTrilha('trilha-1').subscribe();
    const detalheTrilha = httpMock.expectOne('/api/admin/trilhas/trilha-1');
    expect(detalheTrilha.request.method).toBe('GET');
    detalheTrilha.flush({});

    service.criarModulo('trilha-1', { titulo: 'Módulo 1' }).subscribe();
    const modulo = httpMock.expectOne('/api/admin/trilhas/trilha-1/modulos');
    expect(modulo.request.method).toBe('POST');
    modulo.flush({});

    service.criarLicao('modulo-1', criarLicao()).subscribe();
    const licao = httpMock.expectOne('/api/admin/modulos/modulo-1/licoes');
    expect(licao.request.method).toBe('POST');
    licao.flush({});

    service
      .criarConteudo('licao-1', { tipo: 'texto', texto: 'Conteúdo' })
      .subscribe();
    const conteudo = httpMock.expectOne('/api/admin/licoes/licao-1/conteudos');
    expect(conteudo.request.method).toBe('POST');
    conteudo.flush({});
  });

  it('deve manter missões e conquistas', () => {
    service.criarMissao(criarMissao()).subscribe();
    const missao = httpMock.expectOne('/api/admin/missoes');
    expect(missao.request.method).toBe('POST');
    missao.flush({});

    service.atualizarMissao('missao-1', { ativa: false }).subscribe();
    const atualizacaoMissao = httpMock.expectOne('/api/admin/missoes/missao-1');
    expect(atualizacaoMissao.request.method).toBe('PATCH');
    atualizacaoMissao.flush({});

    service.criarConquista(criarConquista()).subscribe();
    const conquista = httpMock.expectOne('/api/admin/conquistas');
    expect(conquista.request.method).toBe('POST');
    conquista.flush({});

    service.atualizarConquista('conquista-1', { ativa: false }).subscribe();
    const atualizacaoConquista = httpMock.expectOne(
      '/api/admin/conquistas/conquista-1',
    );
    expect(atualizacaoConquista.request.method).toBe('PATCH');
    atualizacaoConquista.flush({});
  });
});

function criarTrilha() {
  return {
    titulo: 'Angular',
    descricao: 'Trilha completa',
    descricaoResumo: 'Fundamentos',
    categoriaId: 'categoria-1',
  };
}

function criarLicao() {
  return {
    titulo: 'Componentes',
    descricao: 'Criação de componentes',
  };
}

function criarMissao() {
  return {
    titulo: 'Estudar hoje',
    descricao: 'Concluir uma atividade.',
    tipo: 'diaria' as const,
    xpRecompensa: 20,
    objetivo: 'conclusao_manual',
  };
}

function criarConquista() {
  return {
    codigo: 'primeira-licao',
    titulo: 'Primeira lição',
    descricao: 'Concluir a primeira lição.',
    icone: 'estrela',
    tipoCriterio: 'licoes_concluidas' as const,
    valorCriterio: 1,
    criterio: 'Concluir 1 lição.',
  };
}
