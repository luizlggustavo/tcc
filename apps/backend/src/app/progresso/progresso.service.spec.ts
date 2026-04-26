import { NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ConquistasService } from '../conquistas/conquistas.service';
import { Licao } from '../trilhas/entities/licao.entity';
import { ConclusaoLicao } from './entities/conclusao-licao.entity';
import { ProgressoUsuario } from './entities/progresso-usuario.entity';
import { SessaoEstudo } from './entities/sessao-estudo.entity';
import { ProgressoService } from './progresso.service';
import { XpService } from '../xp/xp.service';

function criarQueryBuilderMock(resultado: {
  getOne?: unknown;
  getCount?: number;
  getRawMany?: unknown[];
}) {
  return {
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(resultado.getOne),
    getCount: jest.fn().mockResolvedValue(resultado.getCount ?? 0),
    getRawMany: jest.fn().mockResolvedValue(resultado.getRawMany ?? []),
  };
}

describe('ProgressoService', () => {
  let service: ProgressoService;
  let progressoRepository: jest.Mocked<
    Pick<
      Repository<ProgressoUsuario>,
      'create' | 'findOne' | 'findOneBy' | 'save'
    >
  >;
  let conclusoesRepository: jest.Mocked<
    Pick<
      Repository<ConclusaoLicao>,
      'count' | 'create' | 'createQueryBuilder' | 'findOne' | 'save'
    >
  >;
  let sessoesRepository: jest.Mocked<
    Pick<Repository<SessaoEstudo>, 'create' | 'findOne' | 'save'>
  >;
  let licoesRepository: jest.Mocked<
    Pick<Repository<Licao>, 'createQueryBuilder'>
  >;
  let dataSource: jest.Mocked<Pick<DataSource, 'transaction'>>;
  let xpService: jest.Mocked<Pick<XpService, 'concederXp'>>;
  let conquistasService: jest.Mocked<Pick<ConquistasService, 'avaliarUsuario'>>;

  const licaoPublicada = { id: 'licao-1' } as Licao;
  const conclusao = {
    usuarioId: 'usuario-1',
    trilhaId: 'trilha-1',
    licaoId: 'licao-1',
    concluidaEm: new Date('2026-06-03T12:00:00.000Z'),
  } as ConclusaoLicao;
  const sessao = {
    usuarioId: 'usuario-1',
    trilhaId: 'trilha-1',
    licaoId: 'licao-1',
    inicioEm: new Date('2026-06-03T11:55:00.000Z'),
    fimEm: new Date('2026-06-03T12:00:00.000Z'),
    duracaoSegundos: 300,
  } as SessaoEstudo;
  const eventoXp = {
    id: 'evento-1',
    usuarioId: 'usuario-1',
    quantidade: 10,
    tipoOrigem: 'conclusao_licao',
    referenciaOrigemId: 'licao-1',
    xpTotalAposEvento: 10,
    nivelAposEvento: 1,
    criadoEm: new Date('2026-06-03T12:00:00.000Z'),
  } as const;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-03T12:00:00.000Z'));

    progressoRepository = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    conclusoesRepository = {
      count: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    sessoesRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    licoesRepository = {
      createQueryBuilder: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn().mockImplementation(async (operacao) =>
        operacao({
          getRepository: jest.fn().mockReturnValue(progressoRepository),
        }),
      ),
    };
    xpService = {
      concederXp: jest.fn().mockResolvedValue(eventoXp),
    };
    conquistasService = {
      avaliarUsuario: jest.fn().mockResolvedValue([]),
    };
    service = new ProgressoService(
      progressoRepository as unknown as Repository<ProgressoUsuario>,
      conclusoesRepository as unknown as Repository<ConclusaoLicao>,
      sessoesRepository as unknown as Repository<SessaoEstudo>,
      licoesRepository as unknown as Repository<Licao>,
      dataSource as unknown as DataSource,
      xpService as unknown as XpService,
      conquistasService as unknown as ConquistasService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve criar progresso inicial quando usuário ainda não possui registro', async () => {
    progressoRepository.findOneBy.mockResolvedValue(null);
    progressoRepository.create.mockReturnValue({
      usuarioId: 'usuario-1',
      xpTotal: 0,
      nivel: 1,
      sequenciaDias: 0,
      ultimoAcessoEm: null,
    } as ProgressoUsuario);
    progressoRepository.save.mockResolvedValue({
      usuarioId: 'usuario-1',
      xpTotal: 0,
      nivel: 1,
      sequenciaDias: 0,
      ultimoAcessoEm: null,
    } as ProgressoUsuario);

    await expect(service.obterOuCriarInicial('usuario-1')).resolves.toEqual({
      xpTotal: 0,
      nivel: 1,
      sequenciaDias: 0,
    });
    expect(progressoRepository.create).toHaveBeenCalledWith({
      usuarioId: 'usuario-1',
      xpTotal: 0,
      nivel: 1,
      sequenciaDias: 0,
      ultimoAcessoEm: null,
    });
  });

  it('deve concluir lição inédita e registrar tempo de estudo', async () => {
    licoesRepository.createQueryBuilder
      .mockReturnValueOnce(
        criarQueryBuilderMock({ getOne: licaoPublicada }) as never,
      )
      .mockReturnValueOnce(criarQueryBuilderMock({ getCount: 4 }) as never);
    conclusoesRepository.createQueryBuilder.mockReturnValue(
      criarQueryBuilderMock({ getCount: 1 }) as never,
    );
    conclusoesRepository.findOne.mockResolvedValue(null);
    conclusoesRepository.create.mockReturnValue(conclusao);
    conclusoesRepository.save.mockResolvedValue(conclusao);
    sessoesRepository.create.mockReturnValue(sessao);
    sessoesRepository.save.mockResolvedValue(sessao);
    progressoRepository.findOne.mockResolvedValue({
      usuarioId: 'usuario-1',
      xpTotal: 10,
      nivel: 1,
      sequenciaDias: 0,
      ultimoAcessoEm: null,
    } as ProgressoUsuario);
    progressoRepository.save.mockImplementation(
      async (dados) => dados as ProgressoUsuario,
    );

    await expect(
      service.concluirLicao('usuario-1', 'trilha-1', 'licao-1', 300),
    ).resolves.toEqual({
      licaoId: 'licao-1',
      concluida: true,
      concluidaEm: conclusao.concluidaEm,
      progressoTrilha: {
        trilhaId: 'trilha-1',
        totalLicoes: 4,
        licoesConcluidas: 1,
        percentualConclusao: 25,
      },
      progressoUsuario: {
        xpTotal: 10,
        nivel: 1,
        sequenciaDias: 1,
      },
      tempoEstudo: {
        usuarioId: 'usuario-1',
        trilhaId: 'trilha-1',
        licaoId: 'licao-1',
        inicioEm: sessao.inicioEm,
        fimEm: sessao.fimEm,
        duracaoSegundos: 300,
      },
      eventoXp,
      conquistasDesbloqueadas: [],
    });
    expect(conclusoesRepository.create).toHaveBeenCalledWith({
      usuarioId: 'usuario-1',
      trilhaId: 'trilha-1',
      licaoId: 'licao-1',
      concluidaEm: expect.any(Date),
    });
    expect(sessoesRepository.create).toHaveBeenCalledWith({
      usuarioId: 'usuario-1',
      trilhaId: 'trilha-1',
      licaoId: 'licao-1',
      inicioEm: expect.any(Date),
      fimEm: expect.any(Date),
      duracaoSegundos: 300,
    });
    expect(xpService.concederXp).toHaveBeenCalledWith({
      usuarioId: 'usuario-1',
      quantidade: 10,
      tipoOrigem: 'conclusao_licao',
      referenciaOrigemId: 'licao-1',
    });
    expect(dataSource.transaction).toHaveBeenCalled();
  });

  it('deve manter conclusão idempotente sem duplicar tempo', async () => {
    licoesRepository.createQueryBuilder
      .mockReturnValueOnce(
        criarQueryBuilderMock({ getOne: licaoPublicada }) as never,
      )
      .mockReturnValueOnce(criarQueryBuilderMock({ getCount: 2 }) as never);
    conclusoesRepository.createQueryBuilder.mockReturnValue(
      criarQueryBuilderMock({ getCount: 1 }) as never,
    );
    conclusoesRepository.findOne.mockResolvedValue(conclusao);
    sessoesRepository.findOne.mockResolvedValue(sessao);
    progressoRepository.findOneBy.mockResolvedValue({
      usuarioId: 'usuario-1',
      xpTotal: 10,
      nivel: 1,
      sequenciaDias: 1,
      ultimoAcessoEm: new Date('2026-06-03T12:00:00.000Z'),
    } as ProgressoUsuario);

    await expect(
      service.concluirLicao('usuario-1', 'trilha-1', 'licao-1', 600),
    ).resolves.toMatchObject({
      licaoId: 'licao-1',
      concluida: true,
      progressoTrilha: {
        percentualConclusao: 50,
      },
      tempoEstudo: {
        duracaoSegundos: 300,
      },
      progressoUsuario: {
        xpTotal: 10,
        nivel: 1,
        sequenciaDias: 1,
      },
      eventoXp: null,
      conquistasDesbloqueadas: [],
    });
    expect(conclusoesRepository.create).not.toHaveBeenCalled();
    expect(sessoesRepository.create).not.toHaveBeenCalled();
    expect(xpService.concederXp).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('deve rejeitar lição inexistente ou indisponível', async () => {
    licoesRepository.createQueryBuilder.mockReturnValue(
      criarQueryBuilderMock({ getOne: null }) as never,
    );

    await expect(
      service.concluirLicao('usuario-1', 'trilha-1', 'licao-1', 300),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve calcular percentual de progresso por trilha', async () => {
    licoesRepository.createQueryBuilder.mockReturnValue(
      criarQueryBuilderMock({ getCount: 5 }) as never,
    );
    conclusoesRepository.createQueryBuilder.mockReturnValue(
      criarQueryBuilderMock({ getCount: 2 }) as never,
    );

    await expect(
      service.calcularProgressoTrilha('usuario-1', 'trilha-1'),
    ).resolves.toEqual({
      trilhaId: 'trilha-1',
      totalLicoes: 5,
      licoesConcluidas: 2,
      percentualConclusao: 40,
    });
  });

  it('deve incrementar sequência quando último estudo foi ontem no fuso de Brasília', async () => {
    await concluirLicaoComProgresso({
      sequenciaDias: 2,
      ultimoAcessoEm: new Date('2026-06-02T12:00:00.000Z'),
    });

    expect(progressoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        sequenciaDias: 3,
        ultimoAcessoEm: new Date('2026-06-03T12:00:00.000Z'),
      }),
    );
  });

  it('deve considerar virada de dia pelo fuso de Brasília', async () => {
    jest.setSystemTime(new Date('2026-06-03T03:30:00.000Z'));

    await concluirLicaoComProgresso({
      sequenciaDias: 1,
      ultimoAcessoEm: new Date('2026-06-03T02:30:00.000Z'),
    });

    expect(progressoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        sequenciaDias: 2,
        ultimoAcessoEm: new Date('2026-06-03T03:30:00.000Z'),
      }),
    );
  });

  it('deve manter sequência quando já houve estudo no mesmo dia', async () => {
    await concluirLicaoComProgresso({
      sequenciaDias: 2,
      ultimoAcessoEm: new Date('2026-06-03T10:00:00.000Z'),
    });

    expect(progressoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        sequenciaDias: 2,
        ultimoAcessoEm: new Date('2026-06-03T12:00:00.000Z'),
      }),
    );
  });

  it('deve reiniciar sequência quando houver quebra de continuidade', async () => {
    await concluirLicaoComProgresso({
      sequenciaDias: 5,
      ultimoAcessoEm: new Date('2026-06-01T12:00:00.000Z'),
    });

    expect(progressoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        sequenciaDias: 1,
        ultimoAcessoEm: new Date('2026-06-03T12:00:00.000Z'),
      }),
    );
  });

  it('deve retornar sequência ativa zerada quando último estudo expirou', async () => {
    progressoRepository.findOneBy.mockResolvedValue({
      usuarioId: 'usuario-1',
      xpTotal: 30,
      nivel: 1,
      sequenciaDias: 3,
      ultimoAcessoEm: new Date('2026-06-01T12:00:00.000Z'),
    } as ProgressoUsuario);

    await expect(service.obterOuCriarInicial('usuario-1')).resolves.toEqual({
      xpTotal: 30,
      nivel: 1,
      sequenciaDias: 0,
    });
  });

  async function concluirLicaoComProgresso(progresso: {
    sequenciaDias: number;
    ultimoAcessoEm: Date | null;
  }) {
    licoesRepository.createQueryBuilder
      .mockReturnValueOnce(
        criarQueryBuilderMock({ getOne: licaoPublicada }) as never,
      )
      .mockReturnValueOnce(criarQueryBuilderMock({ getCount: 4 }) as never);
    conclusoesRepository.createQueryBuilder.mockReturnValue(
      criarQueryBuilderMock({ getCount: 1 }) as never,
    );
    conclusoesRepository.findOne.mockResolvedValue(null);
    conclusoesRepository.create.mockReturnValue(conclusao);
    conclusoesRepository.save.mockResolvedValue(conclusao);
    sessoesRepository.create.mockReturnValue(sessao);
    sessoesRepository.save.mockResolvedValue(sessao);
    progressoRepository.findOne.mockResolvedValue({
      usuarioId: 'usuario-1',
      xpTotal: 10,
      nivel: 1,
      sequenciaDias: progresso.sequenciaDias,
      ultimoAcessoEm: progresso.ultimoAcessoEm,
    } as ProgressoUsuario);
    progressoRepository.save.mockImplementation(
      async (dados) => dados as ProgressoUsuario,
    );

    return service.concluirLicao('usuario-1', 'trilha-1', 'licao-1', 300);
  }
});
