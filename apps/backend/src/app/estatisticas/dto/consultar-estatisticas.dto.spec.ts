import { validate } from 'class-validator';
import { ConsultarEstatisticasDto } from './consultar-estatisticas.dto';

describe('ConsultarEstatisticasDto', () => {
  it('deve aceitar filtros válidos', async () => {
    const dto = new ConsultarEstatisticasDto();
    dto.inicio = '2026-06-01T00:00:00.000Z';
    dto.fim = '2026-06-30T00:00:00.000Z';
    dto.agrupamento = 'dia';

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('deve rejeitar período e agrupamento inválidos', async () => {
    const dto = new ConsultarEstatisticasDto();
    dto.inicio = 'periodo-invalido';
    dto.fim = '2026-06-30T00:00:00.000Z';
    dto.agrupamento = 'ano' as ConsultarEstatisticasDto['agrupamento'];

    const erros = await validate(dto);

    expect(erros.map((erro) => erro.property)).toEqual(
      expect.arrayContaining(['inicio', 'agrupamento']),
    );
  });
});
