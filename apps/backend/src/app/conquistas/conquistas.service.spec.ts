import { Repository } from 'typeorm';
import { MissaoUsuario } from '../missoes/entities/missao-usuario.entity';
import { ConclusaoLicao } from '../progresso/entities/conclusao-licao.entity';
import { ProgressoUsuario } from '../progresso/entities/progresso-usuario.entity';
import { ConquistasService } from './conquistas.service';
import { ConquistaUsuario } from './entities/conquista-usuario.entity';
import { Conquista } from './entities/conquista.entity';

describe('ConquistasService', () => {
  let service: ConquistasService;
  let conquistasRepository: {
    create: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
  };
  let conquistasUsuariosRepository: {
    create: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
  };
  let conclusoesRepository: { count: jest.Mock };
  let progressoRepository: { findOneBy: jest.Mock };
  let missoesUsuariosRepository: { count: jest.Mock };

  beforeEach(() => {
    conquistasRepository = {
      create: jest.fn((dados) => dados as Conquista),
      find: jest.fn(),
      save: jest.fn(async (dados) => dados as Conquista | Conquista[]),
    };
    conquistasUsuariosRepository = {
      create: jest.fn((dados) => dados as ConquistaUsuario),
      find: jest.fn(),
      save: jest.fn(async (dados) => ({
        id: 'conquista-usuario-1',
        conquistadoEm: new Date('2026-06-05T12:00:00.000Z'),
        ...dados,
      }) as ConquistaUsuario),
    };
    conclusoesRepository = {
      count: jest.fn(),
    };
    progressoRepository = {
      findOneBy: jest.fn(),
    };
    missoesUsuariosRepository = {
      count: jest.fn(),
    };

    service = new ConquistasService(
      conquistasRepository as unknown as Repository<Conquista>,
      conquistasUsuariosRepository as unknown as Repository<ConquistaUsuario>,
      conclusoesRepository as unknown as Repository<ConclusaoLicao>,
      progressoRepository as unknown as Repository<ProgressoUsuario>,
      missoesUsuariosRepository as unknown as Repository<MissaoUsuario>,
    );
  });

  it('deve listar conquistas obtidas e pendentes do usuário', async () => {
    const conquistaObtida = criarConquista({
      id: 'conquista-1',
      titulo: 'Primeira lição',
    });
    const conquistaPendente = criarConquista({
      id: 'conquista-2',
      titulo: '100 XP',
      tipoCriterio: 'xp_total',
      valorCriterio: 100,
    });
    conquistasRepository.find
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([conquistaObtida, conquistaPendente]);
    conquistasUsuariosRepository.find.mockResolvedValue([
      criarConquistaUsuario({ conquistaId: 'conquista-1' }),
    ]);

    await expect(service.listarDoUsuario('usuario-1')).resolves.toEqual([
      {
        conquista: expect.objectContaining({
          id: 'conquista-1',
          titulo: 'Primeira lição',
        }),
        desbloqueada: true,
        conquistadoEm: new Date('2026-06-05T12:00:00.000Z'),
      },
      {
        conquista: expect.objectContaining({
          id: 'conquista-2',
          titulo: '100 XP',
        }),
        desbloqueada: false,
        conquistadoEm: null,
      },
    ]);
  });

  it('deve desbloquear conquista quando critério for atingido', async () => {
    const conquista = criarConquista({
      id: 'conquista-1',
      tipoCriterio: 'licoes_concluidas',
      valorCriterio: 1,
    });
    conquistasRepository.find
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([conquista]);
    conquistasUsuariosRepository.find.mockResolvedValue([]);
    conclusoesRepository.count.mockResolvedValue(1);
    progressoRepository.findOneBy.mockResolvedValue(
      criarProgresso({ xpTotal: 10, sequenciaDias: 1 }),
    );
    missoesUsuariosRepository.count.mockResolvedValue(0);

    await expect(service.avaliarUsuario('usuario-1')).resolves.toEqual([
      {
        id: 'conquista-usuario-1',
        conquistaId: 'conquista-1',
        usuarioId: 'usuario-1',
        conquistadoEm: expect.any(Date),
      },
    ]);
    expect(conquistasUsuariosRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        conquistaId: 'conquista-1',
        usuarioId: 'usuario-1',
      }),
    );
  });

  it('não deve desbloquear conquista já obtida pelo usuário', async () => {
    const conquista = criarConquista({ id: 'conquista-1' });
    conquistasRepository.find
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([conquista]);
    conquistasUsuariosRepository.find.mockResolvedValue([
      criarConquistaUsuario({ conquistaId: 'conquista-1' }),
    ]);
    conclusoesRepository.count.mockResolvedValue(5);
    progressoRepository.findOneBy.mockResolvedValue(criarProgresso());
    missoesUsuariosRepository.count.mockResolvedValue(0);

    await expect(service.avaliarUsuario('usuario-1')).resolves.toEqual([]);
    expect(conquistasUsuariosRepository.save).not.toHaveBeenCalled();
  });
});

function criarConquista(sobrescritas: Partial<Conquista> = {}): Conquista {
  return {
    id: 'conquista-1',
    codigo: 'primeira-licao',
    titulo: 'Primeira lição',
    descricao: 'Concluiu a primeira lição da jornada.',
    icone: 'estrela',
    xpRecompensa: 0,
    tipoCriterio: 'licoes_concluidas',
    valorCriterio: 1,
    criterio: 'Concluir 1 lição.',
    ativa: true,
    usuarios: [],
    criadoEm: new Date('2026-06-01T00:00:00.000Z'),
    atualizadoEm: new Date('2026-06-01T00:00:00.000Z'),
    ...sobrescritas,
  } as Conquista;
}

function criarConquistaUsuario(
  sobrescritas: Partial<ConquistaUsuario> = {},
): ConquistaUsuario {
  return {
    id: 'conquista-usuario-1',
    conquistaId: 'conquista-1',
    usuarioId: 'usuario-1',
    conquistadoEm: new Date('2026-06-05T12:00:00.000Z'),
    criadoEm: new Date('2026-06-05T12:00:00.000Z'),
    ...sobrescritas,
  } as ConquistaUsuario;
}

function criarProgresso(
  sobrescritas: Partial<ProgressoUsuario> = {},
): ProgressoUsuario {
  return {
    id: 'progresso-1',
    usuarioId: 'usuario-1',
    xpTotal: 0,
    nivel: 1,
    sequenciaDias: 0,
    ultimoAcessoEm: null,
    criadoEm: new Date('2026-06-01T00:00:00.000Z'),
    atualizadoEm: new Date('2026-06-01T00:00:00.000Z'),
    ...sobrescritas,
  } as ProgressoUsuario;
}
