import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProgressoUsuario } from '../progresso/entities/progresso-usuario.entity';
import { HistoricoXp } from './entities/historico-xp.entity';
import { XpService } from './xp.service';

describe('XpService', () => {
  let service: XpService;
  let progressoRepository: jest.Mocked<
    Pick<Repository<ProgressoUsuario>, 'create' | 'findOneBy' | 'save'>
  >;
  let historicoRepository: jest.Mocked<
    Pick<Repository<HistoricoXp>, 'create' | 'find' | 'save'>
  >;

  beforeEach(() => {
    progressoRepository = {
      create: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
    };
    historicoRepository = {
      create: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };
    service = new XpService(
      progressoRepository as unknown as Repository<ProgressoUsuario>,
      historicoRepository as unknown as Repository<HistoricoXp>,
    );
  });

  it.each([
    [0, 1],
    [99, 1],
    [100, 2],
    [199, 2],
    [200, 3],
  ])('deve calcular nível %i como %i', (xpTotal, nivelEsperado) => {
    expect(service.calcularNivel(xpTotal)).toBe(nivelEsperado);
  });

  it('deve conceder XP, atualizar progresso e registrar histórico', async () => {
    const progresso = {
      usuarioId: 'usuario-1',
      xpTotal: 95,
      nivel: 1,
      sequenciaDias: 0,
      ultimoAcessoEm: null,
    } as ProgressoUsuario;
    const evento = {
      id: 'evento-1',
      usuarioId: 'usuario-1',
      quantidade: 10,
      tipoOrigem: 'conclusao_licao',
      referenciaOrigemId: 'licao-1',
      xpTotalAposEvento: 105,
      nivelAposEvento: 2,
      criadoEm: new Date('2026-06-03T12:00:00.000Z'),
    } as HistoricoXp;

    progressoRepository.findOneBy.mockResolvedValue(progresso);
    progressoRepository.save.mockImplementation(
      async (dados) => dados as ProgressoUsuario,
    );
    historicoRepository.create.mockReturnValue(evento);
    historicoRepository.save.mockResolvedValue(evento);

    await expect(
      service.concederXp({
        usuarioId: 'usuario-1',
        quantidade: 10,
        tipoOrigem: 'conclusao_licao',
        referenciaOrigemId: 'licao-1',
      }),
    ).resolves.toEqual(evento);
    expect(progressoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ xpTotal: 105, nivel: 2 }),
    );
    expect(historicoRepository.create).toHaveBeenCalledWith({
      usuarioId: 'usuario-1',
      quantidade: 10,
      tipoOrigem: 'conclusao_licao',
      referenciaOrigemId: 'licao-1',
      xpTotalAposEvento: 105,
      nivelAposEvento: 2,
    });
  });

  it('deve rejeitar concessão sem XP positivo', async () => {
    await expect(
      service.concederXp({
        usuarioId: 'usuario-1',
        quantidade: 0,
        tipoOrigem: 'conclusao_licao',
        referenciaOrigemId: 'licao-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve listar histórico filtrando por período', async () => {
    const inicio = new Date('2026-06-01T00:00:00.000Z');
    const fim = new Date('2026-06-05T23:59:59.000Z');

    historicoRepository.find.mockResolvedValue([]);

    await expect(
      service.listarHistorico('usuario-1', { inicio, fim }),
    ).resolves.toEqual([]);
    expect(historicoRepository.find).toHaveBeenCalledWith({
      where: {
        usuarioId: 'usuario-1',
        criadoEm: expect.any(Object),
      },
      order: { criadoEm: 'DESC' },
      take: 20,
    });
  });
});
