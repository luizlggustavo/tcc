import { StatusMissao } from '@tcc/interfaces';
import { IsIn, IsOptional } from 'class-validator';

const STATUS_MISSAO: StatusMissao[] = [
  'disponivel',
  'em_andamento',
  'concluida',
  'expirada',
];

export class ListarMissoesDto {
  @IsOptional()
  @IsIn(STATUS_MISSAO)
  status?: StatusMissao;
}
