import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ListarMissoesDto } from './dto/listar-missoes.dto';
import { MissoesService } from './missoes.service';

interface RequisicaoAutenticada {
  user: {
    id: string;
  };
}

@Controller('missoes')
export class MissoesController {
  constructor(private readonly missoesService: MissoesService) {}

  @Get()
  listar(
    @Req() requisicao: RequisicaoAutenticada,
    @Query() dto: ListarMissoesDto,
  ) {
    return this.missoesService.listar(requisicao.user.id, {
      status: dto.status,
    });
  }

  @Post(':missaoId/iniciar')
  @HttpCode(HttpStatus.OK)
  iniciar(
    @Req() requisicao: RequisicaoAutenticada,
    @Param('missaoId') missaoId: string,
  ) {
    return this.missoesService.iniciar(requisicao.user.id, missaoId);
  }

  @Post(':missaoId/concluir')
  @HttpCode(HttpStatus.OK)
  concluir(
    @Req() requisicao: RequisicaoAutenticada,
    @Param('missaoId') missaoId: string,
  ) {
    return this.missoesService.concluir(requisicao.user.id, missaoId);
  }
}
