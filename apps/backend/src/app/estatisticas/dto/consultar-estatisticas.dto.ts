import { AgrupamentoEstatisticas } from '@tcc/interfaces';
import { IsDateString, IsIn } from 'class-validator';

const AGRUPAMENTOS_ESTATISTICAS: AgrupamentoEstatisticas[] = [
  'dia',
  'semana',
  'mes',
];

export class ConsultarEstatisticasDto {
  @IsDateString()
  inicio: string;

  @IsDateString()
  fim: string;

  @IsIn(AGRUPAMENTOS_ESTATISTICAS)
  agrupamento: AgrupamentoEstatisticas;
}
