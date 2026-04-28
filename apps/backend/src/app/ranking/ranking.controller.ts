import { Controller, Get, Req } from '@nestjs/common';
import { RankingService } from './ranking.service';

interface RequisicaoAutenticada {
  user: {
    id: string;
  };
}

@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('geral')
  listarGeral(@Req() requisicao: RequisicaoAutenticada) {
    return this.rankingService.listarGeral(requisicao.user.id);
  }

  @Get('semanal')
  listarSemanal(@Req() requisicao: RequisicaoAutenticada) {
    return this.rankingService.listarSemanal(requisicao.user.id);
  }
}
