import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CategoriaTrilha } from './entities/categoria-trilha.entity';
import { ConteudoLicao } from './entities/conteudo-licao.entity';
import { Licao } from './entities/licao.entity';
import { ModuloTrilha } from './entities/modulo-trilha.entity';
import { Trilha } from './entities/trilha.entity';
import { TrilhasService } from './trilhas.service';
import { ProgressoService } from '../progresso/progresso.service';

function criarQueryBuilderMock(resultado: unknown) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(resultado),
  };
}

describe('TrilhasService', () => {
  let service: TrilhasService;
  let trilhasRepository: jest.Mocked<
    Pick<Repository<Trilha>, 'find' | 'createQueryBuilder'>
  >;
  let licoesRepository: jest.Mocked<Pick<Repository<Licao>, 'createQueryBuilder'>>;
  let progressoService: jest.Mocked<
    Pick<
      ProgressoService,
      'calcularProgressoTrilha' | 'licaoEstaConcluida' | 'listarLicoesConcluidas'
    >
  >;

  const categoria = {
    id: 'categoria-1',
    nome: 'Programação',
    descricao: 'Conteúdos de programação',
  } as CategoriaTrilha;

  beforeEach(() => {
    trilhasRepository = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    licoesRepository = {
      createQueryBuilder: jest.fn(),
    };
    progressoService = {
      calcularProgressoTrilha: jest.fn().mockResolvedValue({
        trilhaId: 'trilha-1',
        totalLicoes: 1,
        licoesConcluidas: 1,
        percentualConclusao: 100,
      }),
      licaoEstaConcluida: jest.fn().mockResolvedValue(true),
      listarLicoesConcluidas: jest
        .fn()
        .mockResolvedValue(new Set<string>(['licao-1'])),
    };
    service = new TrilhasService(
      trilhasRepository as unknown as Repository<Trilha>,
      licoesRepository as unknown as Repository<Licao>,
      progressoService as unknown as ProgressoService,
    );
  });

  it('deve listar apenas trilhas publicadas ordenadas por título', async () => {
    trilhasRepository.find.mockResolvedValue([
      {
        id: 'trilha-1',
        titulo: 'Angular',
        descricaoResumo: 'Fundamentos de Angular',
        categoria,
      } as Trilha,
    ]);

    await expect(service.listarPublicadas()).resolves.toEqual([
      {
        id: 'trilha-1',
        titulo: 'Angular',
        descricaoResumo: 'Fundamentos de Angular',
        categoria: {
          id: 'categoria-1',
          nome: 'Programação',
          descricao: 'Conteúdos de programação',
        },
      },
    ]);
    expect(trilhasRepository.find).toHaveBeenCalledWith({
      where: { publicada: true },
      relations: { categoria: true },
      order: { titulo: 'ASC' },
    });
  });

  it('deve buscar detalhe público filtrando módulos e lições publicados', async () => {
    const queryBuilder = criarQueryBuilderMock({
      id: 'trilha-1',
      titulo: 'Angular',
      descricao: 'Trilha completa',
      descricaoResumo: 'Fundamentos de Angular',
      categoria,
      modulos: [
        {
          id: 'modulo-1',
          titulo: 'Primeiros passos',
          ordem: 1,
          licoes: [
            {
              id: 'licao-1',
              titulo: 'Componentes',
              descricao: 'Criação de componentes',
              ordem: 1,
            } as Licao,
          ],
        } as ModuloTrilha,
      ],
    } as Trilha);
    trilhasRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as never,
    );

    await expect(
      service.buscarDetalhePublico('usuario-1', 'trilha-1'),
    ).resolves.toEqual({
      id: 'trilha-1',
      titulo: 'Angular',
      descricao: 'Trilha completa',
      descricaoResumo: 'Fundamentos de Angular',
      categoria: {
        id: 'categoria-1',
        nome: 'Programação',
        descricao: 'Conteúdos de programação',
      },
      progresso: {
        trilhaId: 'trilha-1',
        totalLicoes: 1,
        licoesConcluidas: 1,
        percentualConclusao: 100,
      },
      modulos: [
        {
          id: 'modulo-1',
          titulo: 'Primeiros passos',
          ordem: 1,
          licoes: [
            {
              id: 'licao-1',
              titulo: 'Componentes',
              descricao: 'Criação de componentes',
              ordem: 1,
              concluida: true,
            },
          ],
        },
      ],
    });
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'trilha.modulos',
      'modulo',
      'modulo.publicado = :publicado',
      { publicado: true },
    );
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'modulo.licoes',
      'licao',
      'licao.publicada = :publicada',
      { publicada: true },
    );
  });

  it('deve retornar apenas conteúdos publicados da lição', async () => {
    const queryBuilder = criarQueryBuilderMock({
      id: 'licao-1',
      titulo: 'Componentes',
      descricao: 'Criação de componentes',
      ordem: 1,
      modulo: {
        id: 'modulo-1',
        titulo: 'Primeiros passos',
        trilha: {
          id: 'trilha-1',
          titulo: 'Angular',
        },
      },
      conteudos: [
        {
          id: 'conteudo-1',
          tipo: 'texto',
          titulo: 'Introdução',
          texto: 'Conteúdo da lição',
          url: null,
          ordem: 1,
        } as ConteudoLicao,
      ],
    } as Licao);
    licoesRepository.createQueryBuilder.mockReturnValue(queryBuilder as never);

    await expect(
      service.buscarLicaoPublica('usuario-1', 'trilha-1', 'licao-1'),
    ).resolves.toEqual({
      id: 'licao-1',
      titulo: 'Componentes',
      descricao: 'Criação de componentes',
      ordem: 1,
      concluida: true,
      trilha: {
        id: 'trilha-1',
        titulo: 'Angular',
      },
      modulo: {
        id: 'modulo-1',
        titulo: 'Primeiros passos',
      },
      conteudos: [
        {
          id: 'conteudo-1',
          tipo: 'texto',
          titulo: 'Introdução',
          texto: 'Conteúdo da lição',
          url: null,
          ordem: 1,
        },
      ],
    });
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'licao.conteudos',
      'conteudo',
      'conteudo.publicado = :conteudoPublicado',
      { conteudoPublicado: true },
    );
  });

  it('deve rejeitar trilha inexistente ou não publicada', async () => {
    const queryBuilder = criarQueryBuilderMock(null);
    trilhasRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as never,
    );

    await expect(
      service.buscarDetalhePublico('usuario-1', 'trilha-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve rejeitar lição inexistente, não publicada ou fora da trilha', async () => {
    const queryBuilder = criarQueryBuilderMock(null);
    licoesRepository.createQueryBuilder.mockReturnValue(queryBuilder as never);

    await expect(
      service.buscarLicaoPublica('usuario-1', 'trilha-1', 'licao-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
