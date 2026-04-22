import { IsInt, Max, Min } from 'class-validator';

export class ConcluirLicaoDto {
  @IsInt()
  @Min(1)
  @Max(86400)
  tempoEstudoSegundos: number;
}
