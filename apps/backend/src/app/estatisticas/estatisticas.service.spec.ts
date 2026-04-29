import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MissaoUsuario } from '../missoes/entities/missao-usuario.entity';
import { ConclusaoLicao } from '../progresso/entities/conclusao-licao.entity';
import { ProgressoUsuario } from '../progresso/entities/progresso-usuario.entity';
import { SessaoEstudo } from '../progresso/entities/sessao-estudo.entity';
import { HistoricoXp } from '../xp/entities/historico-xp.entity';
import { AcessoUsuario } from './entities/acesso-usuario.entity';
import { EstatisticasService } from './estatisticas.service';

interface ConstrutorConsultaMock {
  select: jest.Mock;
  addSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  groupBy: jest.Mock;
  getRawMany: jest.Mock;
  getRawOne: jest.Mock;
}

function criarConstrutorConsultaMock(): ConstrutorConsultaMock {
  return {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue({ valor: 0 }),
  };
}

describe('EstatisticasService', () => {
  let service: EstatisticasService;
  let acessosRepository: jest.Mocked<
    Pick<Repository<AcessoUsuario>, 'create' | 'createQueryBuilder' | 'save'>
  >;
  let sessoesRepository: { createQueryBuilder: jest.Mock };
  let conclusoesRepository: { createQueryBuilder: jest.Mock };
  let historicosXpRepository: { createQueryBuilder: jest.Mock };
  let missoesUsuariosRepository: { createQueryBuilder: jest.Mock };
  let progressosRepository: { createQueryBuilder: jest.Mock };
  let construtoresConsulta: ConstrutorConsultaMock[];

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-10T12:00:00.000Z'));

    construtoresConsulta = Array.from({ length: 7 }, () =>
      criarConstrutorConsultaMock(),
    );
    acessosRepository = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(construtoresConsulta[0])
        .mockReturnValueOnce(construtoresConsulta[1]),
    };
    sessoesRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(construtoresConsulta[2]),
    };
    conclusoesRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(construtoresConsulta[3]),
    };
    historicosXpRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(construtoresConsulta[4]),
    };
    missoesUsuariosRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(construtoresConsulta[5]),
    };
    progressosRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(construtoresConsulta[6]),
    };

    service = new EstatisticasService(
      acessosRepository as unknown as Repository<AcessoUsuario>,
      sessoesRepository as unknown as Repository<SessaoEstudo>,
      conclusoesRepository as unknown as Repository<ConclusaoLicao>,
      historicosXpRepository as unknown as Repository<HistoricoXp>,
      missoesUsuariosRepository as unknown as Repository<MissaoUsuario>,
      progressosRepository as unknown as Repository<ProgressoUsuario>,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve registrar acesso autenticado do usuário', async () => {
    const acesso = {
      usuarioId: 'usuario-1',
      acessadoEm: new Date('2026-06-10T12:00:00.000Z'),
    } as AcessoUsuario;
    acessosRepository.create.mockReturnValue(acesso);
    acessosRepository.save.mockResolvedValue(acesso);

    await expect(service.registrarAcesso('usuario-1')).resolves.toBeUndefined();

    expect(acessosRepository.create).toHaveBeenCalledWith({
      usuarioId: 'usuario-1',
      acessadoEm: new Date('2026-06-10T12:00:00.000Z'),
    });
    expect(acessosRepository.save).toHaveBeenCalledWith(acesso);
  });

  it('deve agregar métricas por período sem dados sensíveis', async () => {
    construtoresConsulta[0].getRawMany.mockResolvedValue([
      { periodo: '2026-06-10', valor: '2' },
    ]);
    construtoresConsulta[1].getRawMany.mockResolvedValue([
      { periodo: '2026-06-10', valor: '1' },
    ]);
    construtoresConsulta[2].getRawMany.mockResolvedValue([
      { periodo: '2026-06-10', valor: '900' },
    ]);
    construtoresConsulta[3].getRawMany.mockResolvedValue([
      { periodo: '2026-06-10', valor: '3' },
    ]);
    construtoresConsulta[4].getRawMany.mockResolvedValue([
      { periodo: '2026-06-10', valor: '30' },
    ]);
    construtoresConsulta[5].getRawMany.mockResolvedValue([
      { periodo: '2026-06-10', valor: '1' },
    ]);
    construtoresConsulta[6].getRawOne.mockResolvedValue({ valor: '2.5' });

    const linhas = await service.consultarAgregado({
      inicio: new Date('2026-06-10T00:00:00.000Z'),
      fim: new Date('2026-06-11T00:00:00.000Z'),
      agrupamento: 'dia',
    });

    expect(linhas).toEqual([
      {
        periodoInicio: new Date('2026-06-10T00:00:00.000Z'),
        periodoFim: new Date('2026-06-11T00:00:00.000Z'),
        metrica: 'acessos',
        valor: 2,
      },
      {
        periodoInicio: new Date('2026-06-10T00:00:00.000Z'),
        periodoFim: new Date('2026-06-11T00:00:00.000Z'),
        metrica: 'usuarios_ativos',
        valor: 1,
      },
      {
        periodoInicio: new Date('2026-06-10T00:00:00.000Z'),
        periodoFim: new Date('2026-06-11T00:00:00.000Z'),
        metrica: 'tempo_estudado_segundos',
        valor: 900,
      },
      {
        periodoInicio: new Date('2026-06-10T00:00:00.000Z'),
        periodoFim: new Date('2026-06-11T00:00:00.000Z'),
        metrica: 'licoes_concluidas',
        valor: 3,
      },
      {
        periodoInicio: new Date('2026-06-10T00:00:00.000Z'),
        periodoFim: new Date('2026-06-11T00:00:00.000Z'),
        metrica: 'xp_obtido',
        valor: 30,
      },
      {
        periodoInicio: new Date('2026-06-10T00:00:00.000Z'),
        periodoFim: new Date('2026-06-11T00:00:00.000Z'),
        metrica: 'missoes_concluidas',
        valor: 1,
      },
      {
        periodoInicio: new Date('2026-06-10T00:00:00.000Z'),
        periodoFim: new Date('2026-06-11T00:00:00.000Z'),
        metrica: 'sequencia_media_atual',
        valor: 2.5,
      },
    ]);
    expect(construtoresConsulta[0].andWhere).toHaveBeenCalledWith(
      'acesso.acessadoEm < :fim',
      { fim: new Date('2026-06-11T00:00:00.000Z') },
    );
  });

  it('deve filtrar métricas pelo usuário atual quando consultar dados individuais', async () => {
    await service.consultarDoUsuario('usuario-1', {
      inicio: new Date('2026-06-10T00:00:00.000Z'),
      fim: new Date('2026-06-11T00:00:00.000Z'),
      agrupamento: 'dia',
    });

    expect(construtoresConsulta[0].andWhere).toHaveBeenCalledWith(
      'acesso.usuarioId = :usuarioId',
      { usuarioId: 'usuario-1' },
    );
    expect(construtoresConsulta[6].where).toHaveBeenCalledWith(
      'progresso.usuarioId = :usuarioId',
      { usuarioId: 'usuario-1' },
    );
  });

  it('deve retornar valores zerados quando não houver dados no período', async () => {
    const linhas = await service.consultarAgregado({
      inicio: new Date('2026-06-10T00:00:00.000Z'),
      fim: new Date('2026-06-11T00:00:00.000Z'),
      agrupamento: 'dia',
    });

    expect(linhas).toHaveLength(7);
    expect(linhas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ metrica: 'acessos', valor: 0 }),
        expect.objectContaining({ metrica: 'usuarios_ativos', valor: 0 }),
        expect.objectContaining({
          metrica: 'tempo_estudado_segundos',
          valor: 0,
        }),
        expect.objectContaining({ metrica: 'licoes_concluidas', valor: 0 }),
        expect.objectContaining({ metrica: 'xp_obtido', valor: 0 }),
        expect.objectContaining({ metrica: 'missoes_concluidas', valor: 0 }),
        expect.objectContaining({
          metrica: 'sequencia_media_atual',
          valor: 0,
        }),
      ]),
    );
  });

  it('deve respeitar início e fim filtrados em semanas parciais', async () => {
    const linhas = await service.consultarAgregado({
      inicio: new Date('2026-06-10T00:00:00.000Z'),
      fim: new Date('2026-06-20T00:00:00.000Z'),
      agrupamento: 'semana',
    });

    expect(linhas.filter((linha) => linha.metrica === 'acessos')).toEqual([
      {
        periodoInicio: new Date('2026-06-10T00:00:00.000Z'),
        periodoFim: new Date('2026-06-15T00:00:00.000Z'),
        metrica: 'acessos',
        valor: 0,
      },
      {
        periodoInicio: new Date('2026-06-15T00:00:00.000Z'),
        periodoFim: new Date('2026-06-20T00:00:00.000Z'),
        metrica: 'acessos',
        valor: 0,
      },
    ]);
  });

  it('deve respeitar início e fim filtrados em meses parciais', async () => {
    const linhas = await service.consultarAgregado({
      inicio: new Date('2026-06-10T00:00:00.000Z'),
      fim: new Date('2026-08-05T00:00:00.000Z'),
      agrupamento: 'mes',
    });

    expect(linhas.filter((linha) => linha.metrica === 'acessos')).toEqual([
      {
        periodoInicio: new Date('2026-06-10T00:00:00.000Z'),
        periodoFim: new Date('2026-07-01T00:00:00.000Z'),
        metrica: 'acessos',
        valor: 0,
      },
      {
        periodoInicio: new Date('2026-07-01T00:00:00.000Z'),
        periodoFim: new Date('2026-08-01T00:00:00.000Z'),
        metrica: 'acessos',
        valor: 0,
      },
      {
        periodoInicio: new Date('2026-08-01T00:00:00.000Z'),
        periodoFim: new Date('2026-08-05T00:00:00.000Z'),
        metrica: 'acessos',
        valor: 0,
      },
    ]);
  });

  it('deve rejeitar período inválido', async () => {
    await expect(
      service.consultarAgregado({
        inicio: new Date('2026-06-11T00:00:00.000Z'),
        fim: new Date('2026-06-10T00:00:00.000Z'),
        agrupamento: 'dia',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve exportar CSV agregado sem identificadores pessoais', async () => {
    construtoresConsulta[0].getRawMany.mockResolvedValue([
      { periodo: '2026-06-10', valor: '1' },
    ]);

    const csv = await service.exportarCsv({
      inicio: new Date('2026-06-10T00:00:00.000Z'),
      fim: new Date('2026-06-11T00:00:00.000Z'),
      agrupamento: 'dia',
    });

    expect(csv).toContain('periodo_inicio,periodo_fim,metrica,valor');
    expect(csv).toContain(
      '2026-06-10T00:00:00.000Z,2026-06-11T00:00:00.000Z,acessos,1',
    );
    expect(csv).not.toContain('usuarioId');
    expect(csv).not.toContain('email');
    expect(csv).not.toContain('nome');
  });
});
