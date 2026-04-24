import { Controller, Get, Query, Req } from '@nestjs/common';
import { ListarHistoricoXpDto } from './dto/listar-historico-xp.dto';
import { XpService } from './xp.service';

interface RequisicaoAutenticada {
  user: {
    id: string;
  };
}

@Controller('xp')
export class XpController {
  constructor(private readonly xpService: XpService) {}

  @Get('historico')
  listarHistorico(
    @Req() requisicao: RequisicaoAutenticada,
    @Query() dto: ListarHistoricoXpDto,
  ) {
    return this.xpService.listarHistorico(requisicao.user.id, {
      inicio: dto.inicio ? new Date(dto.inicio) : undefined,
      fim: dto.fim ? new Date(dto.fim) : undefined,
    });
  }
}
