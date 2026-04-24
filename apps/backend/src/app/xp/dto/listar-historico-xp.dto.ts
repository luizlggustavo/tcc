import { IsDateString, IsOptional } from 'class-validator';

export class ListarHistoricoXpDto {
  @IsOptional()
  @IsDateString()
  inicio?: string;

  @IsOptional()
  @IsDateString()
  fim?: string;
}
