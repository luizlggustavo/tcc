import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConquistasService } from '../conquistas/conquistas.service';
import { XpService } from '../xp/xp.service';
import { MissaoUsuario } from './entities/missao-usuario.entity';
import { Missao } from './entities/missao.entity';
import { MissoesService } from './missoes.service';

describe('MissoesService', () => {
  let service: MissoesService;
  let missoesRepository: jest.Mocked<
    Pick<Repository<Missao>, 'find' | 'findOne'>
  >;
  let missoesUsuariosRepository: jest.Mocked<
    Pick<Repository<MissaoUsuario>, 'create' | 'find' | 'findOne' | 'save'>
  >;
  let xpService: jest.Mocked<Pick<XpService, 'concederXp'>>;
  let conquistasService: jest.Mocked<Pick<ConquistasService, 'avaliarUsuario'>>;

  const agora = new Date('2026-06-05T12:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(agora);

    missoesRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    missoesUsuariosRepository = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    xpService = {
      concederXp: jest.fn(),
    };
    conquistasService = {
      avaliarUsuario: jest.fn().mockResolvedValue([]),
    };

    service = new MissoesService(
      missoesRepository as unknown as Repository<Missao>,
      missoesUsuariosRepository as unknown as Repository<MissaoUsuario>,
      xpService as unknown as XpService,
      conquistasService as unknown as ConquistasService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve listar missões disponíveis e em andamento por usuário', async () => {
    const missaoDisponivel = criarMissao({ id: 'missao-1', tipo: 'diaria' });
    const missaoIniciada = criarMissao({ id: 'missao-2', tipo: 'semanal' });
    const registro = criarMissaoUsuario({
      id: 'missao-usuario-1',
      missaoId: 'missao-2',
      status: 'em_andamento',
      cicloReferencia: '2026-W23',
      iniciadoEm: agora,
    });
    missoesRepository.find.mockResolvedValue([
      missaoDisponivel,
      missaoIniciada,
    ]);
    missoesUsuariosRepository.find.mockResolvedValue([registro]);

    await expect(service.listar('usuario-1')).resolves.toEqual([
      {
        missao: expect.objectContaining({ id: 'missao-1' }),
        status: 'disponivel',
        cicloReferencia: '2026-06-05',
        iniciadoEm: null,
        concluidoEm: null,
      },
      {
        missao: expect.objectContaining({ id: 'missao-2' }),
        status: 'em_andamento',
        cicloReferencia: '2026-W23',
        iniciadoEm: agora,
        concluidoEm: null,
      },
    ]);
  });

  it('deve iniciar missão disponível no ciclo atual', async () => {
    const missao = criarMissao({ id: 'missao-1', tipo: 'diaria' });
    const registroCriado = criarMissaoUsuario({
      id: 'missao-usuario-1',
      missaoId: 'missao-1',
      status: 'em_andamento',
      cicloReferencia: '2026-06-05',
      iniciadoEm: agora,
    });
    missoesRepository.findOne.mockResolvedValue(missao);
    missoesUsuariosRepository.findOne.mockResolvedValue(null);
    missoesUsuariosRepository.create.mockReturnValue(
      criarMissaoUsuario({
        missaoId: 'missao-1',
        cicloReferencia: '2026-06-05',
      }),
    );
    missoesUsuariosRepository.save.mockResolvedValue(registroCriado);

    await expect(service.iniciar('usuario-1', 'missao-1')).resolves.toEqual({
      id: 'missao-usuario-1',
      missaoId: 'missao-1',
      usuarioId: 'usuario-1',
      status: 'em_andamento',
      cicloReferencia: '2026-06-05',
      iniciadoEm: agora,
      concluidoEm: null,
    });
    expect(missoesUsuariosRepository.create).toHaveBeenCalledWith({
      usuarioId: 'usuario-1',
      missaoId: 'missao-1',
      cicloReferencia: '2026-06-05',
    });
  });

  it('deve impedir reinício de missão única concluída', async () => {
    const missao = criarMissao({ id: 'missao-1', tipo: 'unica' });
    missoesRepository.findOne.mockResolvedValue(missao);
    missoesUsuariosRepository.findOne.mockResolvedValue(
      criarMissaoUsuario({
        missaoId: 'missao-1',
        status: 'concluida',
        cicloReferencia: 'unica',
        concluidoEm: agora,
      }),
    );

    await expect(
      service.iniciar('usuario-1', 'missao-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve concluir missão em andamento e conceder XP', async () => {
    const missao = criarMissao({
      id: 'missao-1',
      tipo: 'semanal',
      xpRecompensa: 30,
    });
    const registro = criarMissaoUsuario({
      id: 'missao-usuario-1',
      missaoId: 'missao-1',
      status: 'em_andamento',
      cicloReferencia: '2026-W23',
      iniciadoEm: agora,
    });
    const registroConcluido = { ...registro, status: 'concluida' as const };
    const eventoXp = {
      id: 'evento-1',
      usuarioId: 'usuario-1',
      quantidade: 30,
      tipoOrigem: 'conclusao_missao',
      referenciaOrigemId: 'missao-usuario-1',
      xpTotalAposEvento: 130,
      nivelAposEvento: 2,
      criadoEm: agora,
    } as const;
    missoesRepository.findOne.mockResolvedValue(missao);
    missoesUsuariosRepository.findOne.mockResolvedValue(registro);
    missoesUsuariosRepository.save.mockResolvedValue(registroConcluido);
    xpService.concederXp.mockResolvedValue(eventoXp);

    await expect(service.concluir('usuario-1', 'missao-1')).resolves.toEqual({
      missaoUsuario: expect.objectContaining({
        id: 'missao-usuario-1',
        status: 'concluida',
      }),
      eventoXp,
      conquistasDesbloqueadas: [],
    });
    expect(xpService.concederXp).toHaveBeenCalledWith({
      usuarioId: 'usuario-1',
      quantidade: 30,
      tipoOrigem: 'conclusao_missao',
      referenciaOrigemId: 'missao-usuario-1',
    });
  });

  it('deve manter conclusão idempotente sem duplicar XP', async () => {
    const missao = criarMissao({ id: 'missao-1', tipo: 'diaria' });
    missoesRepository.findOne.mockResolvedValue(missao);
    missoesUsuariosRepository.findOne.mockResolvedValue(
      criarMissaoUsuario({
        id: 'missao-usuario-1',
        missaoId: 'missao-1',
        status: 'concluida',
        cicloReferencia: '2026-06-05',
        concluidoEm: agora,
      }),
    );

    await expect(service.concluir('usuario-1', 'missao-1')).resolves.toEqual({
      missaoUsuario: expect.objectContaining({
        id: 'missao-usuario-1',
        status: 'concluida',
      }),
      eventoXp: null,
      conquistasDesbloqueadas: [],
    });
    expect(xpService.concederXp).not.toHaveBeenCalled();
  });

  it('deve impedir conclusão de missão expirada', async () => {
    const missao = criarMissao({
      id: 'missao-1',
      fimEm: new Date('2026-06-04T12:00:00.000Z'),
    });
    missoesRepository.findOne.mockResolvedValue(missao);
    missoesUsuariosRepository.findOne.mockResolvedValue(
      criarMissaoUsuario({
        missaoId: 'missao-1',
        status: 'em_andamento',
        cicloReferencia: '2026-06-05',
      }),
    );

    await expect(
      service.concluir('usuario-1', 'missao-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(xpService.concederXp).not.toHaveBeenCalled();
  });
});

function criarMissao(sobrescritas: Partial<Missao> = {}): Missao {
  return {
    id: 'missao-1',
    titulo: 'Estudar hoje',
    descricao: 'Concluir um objetivo de estudo.',
    tipo: 'diaria',
    xpRecompensa: 20,
    objetivo: 'conclusao_manual',
    ativa: true,
    inicioEm: null,
    fimEm: null,
    criadoEm: new Date('2026-06-01T00:00:00.000Z'),
    atualizadoEm: new Date('2026-06-01T00:00:00.000Z'),
    ...sobrescritas,
  } as Missao;
}

function criarMissaoUsuario(
  sobrescritas: Partial<MissaoUsuario> = {},
): MissaoUsuario {
  return {
    id: 'missao-usuario-1',
    usuarioId: 'usuario-1',
    missaoId: 'missao-1',
    status: 'em_andamento',
    cicloReferencia: '2026-06-05',
    iniciadoEm: null,
    concluidoEm: null,
    criadoEm: new Date('2026-06-01T00:00:00.000Z'),
    atualizadoEm: new Date('2026-06-01T00:00:00.000Z'),
    ...sobrescritas,
  } as MissaoUsuario;
}
