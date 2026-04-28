import { Repository } from 'typeorm';
import { ProgressoUsuario } from '../progresso/entities/progresso-usuario.entity';
import { Usuario } from '../usuario/entities/usuario.entity';
import { HistoricoXp } from '../xp/entities/historico-xp.entity';
import { RankingService } from './ranking.service';

describe('RankingService', () => {
  let service: RankingService;
  let usuarioRepository: { find: jest.Mock };
  let progressoRepository: { find: jest.Mock };
  let historicoRepository: { createQueryBuilder: jest.Mock };
  let queryBuilder: {
    select: jest.Mock;
    addSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    groupBy: jest.Mock;
    getRawMany: jest.Mock;
  };

  beforeEach(() => {
    usuarioRepository = { find: jest.fn() };
    progressoRepository = { find: jest.fn() };
    queryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };
    historicoRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    service = new RankingService(
      usuarioRepository as unknown as Repository<Usuario>,
      progressoRepository as unknown as Repository<ProgressoUsuario>,
      historicoRepository as unknown as Repository<HistoricoXp>,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve listar ranking geral por XP total com desempate por nome e id', async () => {
    usuarioRepository.find.mockResolvedValue([
      criarUsuario({ id: 'usuario-3', nome: 'Bruno' }),
      criarUsuario({ id: 'usuario-2', nome: 'Ana' }),
      criarUsuario({ id: 'usuario-1', nome: 'Caio' }),
    ]);
    progressoRepository.find.mockResolvedValue([
      criarProgresso({ usuarioId: 'usuario-1', xpTotal: 100, nivel: 2 }),
      criarProgresso({ usuarioId: 'usuario-2', xpTotal: 200, nivel: 3 }),
      criarProgresso({ usuarioId: 'usuario-3', xpTotal: 200, nivel: 3 }),
    ]);

    await expect(service.listarGeral('usuario-1')).resolves.toEqual({
      tipo: 'geral',
      limite: 50,
      periodo: null,
      entradas: [
        {
          posicao: 1,
          usuarioId: 'usuario-2',
          nomeUsuario: 'Ana',
          xp: 200,
          nivel: 3,
          usuarioAtual: false,
        },
        {
          posicao: 2,
          usuarioId: 'usuario-3',
          nomeUsuario: 'Bruno',
          xp: 200,
          nivel: 3,
          usuarioAtual: false,
        },
        {
          posicao: 3,
          usuarioId: 'usuario-1',
          nomeUsuario: 'Caio',
          xp: 100,
          nivel: 2,
          usuarioAtual: true,
        },
      ],
      minhaEntrada: {
        posicao: 3,
        usuarioId: 'usuario-1',
        nomeUsuario: 'Caio',
        xp: 100,
        nivel: 2,
        usuarioAtual: true,
      },
    });
  });

  it('deve listar top 50 e manter a posição do usuário atual fora do topo', async () => {
    const usuarios = Array.from({ length: 51 }, (_, indice) =>
      criarUsuario({
        id: `usuario-${indice + 1}`,
        nome: indice === 50 ? 'Usuario atual' : `Usuario ${indice + 1}`,
      }),
    );
    const progressos = usuarios.map((usuario, indice) =>
      criarProgresso({
        usuarioId: usuario.id,
        xpTotal: indice === 50 ? 0 : 1000 - indice,
        nivel: 1,
      }),
    );
    usuarioRepository.find.mockResolvedValue(usuarios);
    progressoRepository.find.mockResolvedValue(progressos);

    const resposta = await service.listarGeral('usuario-51');

    expect(resposta.entradas).toHaveLength(50);
    expect(resposta.entradas.some((entrada) => entrada.usuarioAtual)).toBe(
      false,
    );
    expect(resposta.minhaEntrada).toEqual({
      posicao: 51,
      usuarioId: 'usuario-51',
      nomeUsuario: 'Usuario atual',
      xp: 0,
      nivel: 1,
      usuarioAtual: true,
    });
  });

  it('deve listar ranking semanal somando XP dentro da semana atual', async () => {
    jest.useFakeTimers({
      now: new Date('2026-06-10T12:00:00.000-03:00'),
    });
    usuarioRepository.find.mockResolvedValue([
      criarUsuario({ id: 'usuario-1', nome: 'Ana' }),
      criarUsuario({ id: 'usuario-2', nome: 'Bruno' }),
    ]);
    progressoRepository.find.mockResolvedValue([
      criarProgresso({ usuarioId: 'usuario-1', xpTotal: 500, nivel: 6 }),
      criarProgresso({ usuarioId: 'usuario-2', xpTotal: 300, nivel: 4 }),
    ]);
    queryBuilder.getRawMany.mockResolvedValue([
      { usuarioId: 'usuario-2', xp: '40' },
      { usuarioId: 'usuario-1', xp: '20' },
    ]);

    const resposta = await service.listarSemanal('usuario-1');

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'historico.criadoEm >= :inicio',
      { inicio: expect.any(Date) },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'historico.criadoEm < :fimExclusivo',
      { fimExclusivo: expect.any(Date) },
    );
    expect(resposta.tipo).toBe('semanal');
    expect(resposta.periodo?.inicio.getDay()).toBe(1);
    expect(resposta.entradas).toEqual([
      {
        posicao: 1,
        usuarioId: 'usuario-2',
        nomeUsuario: 'Bruno',
        xp: 40,
        nivel: 4,
        usuarioAtual: false,
      },
      {
        posicao: 2,
        usuarioId: 'usuario-1',
        nomeUsuario: 'Ana',
        xp: 20,
        nivel: 6,
        usuarioAtual: true,
      },
    ]);
  });
});

function criarUsuario(sobrescritas: Partial<Usuario> = {}): Usuario {
  return {
    id: 'usuario-1',
    nome: 'Usuário',
    email: 'usuario@teste.com',
    papel: 'estudante',
    hashSenha: 'hash',
    criadoEm: new Date('2026-06-01T00:00:00.000Z'),
    atualizadoEm: new Date('2026-06-01T00:00:00.000Z'),
    ...sobrescritas,
  } as Usuario;
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
