import { PAPEIS_KEY } from '../auth/decorators/papeis.decorator';
import { EstatisticasController } from './estatisticas.controller';
import { EstatisticasService } from './estatisticas.service';

describe('EstatisticasController', () => {
  let controller: EstatisticasController;
  let estatisticasService: jest.Mocked<
    Pick<
      EstatisticasService,
      | 'registrarAcesso'
      | 'consultarDoUsuario'
      | 'consultarAgregado'
      | 'exportarCsv'
    >
  >;

  beforeEach(() => {
    estatisticasService = {
      registrarAcesso: jest.fn().mockResolvedValue(undefined),
      consultarDoUsuario: jest.fn().mockResolvedValue([]),
      consultarAgregado: jest.fn().mockResolvedValue([]),
      exportarCsv: jest
        .fn()
        .mockResolvedValue('periodo_inicio,periodo_fim,metrica,valor'),
    };

    controller = new EstatisticasController(
      estatisticasService as unknown as EstatisticasService,
    );
  });

  it('deve consultar uso agregado com filtros de período', async () => {
    await controller.consultarUsoAgregado({
      inicio: '2026-06-01T00:00:00.000Z',
      fim: '2026-06-30T00:00:00.000Z',
      agrupamento: 'dia',
    });

    expect(estatisticasService.consultarAgregado).toHaveBeenCalledWith({
      inicio: new Date('2026-06-01T00:00:00.000Z'),
      fim: new Date('2026-06-30T00:00:00.000Z'),
      agrupamento: 'dia',
    });
  });

  it('deve exigir papel administrador para consulta e exportação agregadas', () => {
    const papeisConsulta = Reflect.getMetadata(
      PAPEIS_KEY,
      EstatisticasController.prototype.consultarUsoAgregado,
    );
    const papeisExportacao = Reflect.getMetadata(
      PAPEIS_KEY,
      EstatisticasController.prototype.exportarCsv,
    );

    expect(papeisConsulta).toEqual(['administrador']);
    expect(papeisExportacao).toEqual(['administrador']);
  });
});
