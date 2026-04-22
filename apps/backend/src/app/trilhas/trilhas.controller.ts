import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ConcluirLicaoDto } from '../progresso/dto/concluir-licao.dto';
import { ProgressoService } from '../progresso/progresso.service';
import { TrilhasService } from './trilhas.service';

interface RequisicaoAutenticada {
  user: {
    id: string;
  };
}

@Controller('trilhas')
export class TrilhasController {
  constructor(
    private readonly trilhasService: TrilhasService,
    private readonly progressoService: ProgressoService,
  ) {}

  @Get()
  listarPublicadas() {
    return this.trilhasService.listarPublicadas();
  }

  @Get(':trilhaId')
  buscarDetalhe(
    @Req() requisicao: RequisicaoAutenticada,
    @Param('trilhaId') trilhaId: string,
  ) {
    return this.trilhasService.buscarDetalhePublico(
      requisicao.user.id,
      trilhaId,
    );
  }

  @Get(':trilhaId/progresso')
  buscarProgresso(
    @Req() requisicao: RequisicaoAutenticada,
    @Param('trilhaId') trilhaId: string,
  ) {
    return this.progressoService.calcularProgressoTrilha(
      requisicao.user.id,
      trilhaId,
    );
  }

  @Get(':trilhaId/licoes/:licaoId')
  buscarLicao(
    @Req() requisicao: RequisicaoAutenticada,
    @Param('trilhaId') trilhaId: string,
    @Param('licaoId') licaoId: string,
  ) {
    return this.trilhasService.buscarLicaoPublica(
      requisicao.user.id,
      trilhaId,
      licaoId,
    );
  }

  @Post(':trilhaId/licoes/:licaoId/concluir')
  @HttpCode(HttpStatus.OK)
  concluirLicao(
    @Req() requisicao: RequisicaoAutenticada,
    @Param('trilhaId') trilhaId: string,
    @Param('licaoId') licaoId: string,
    @Body() dto: ConcluirLicaoDto,
  ) {
    return this.progressoService.concluirLicao(
      requisicao.user.id,
      trilhaId,
      licaoId,
      dto.tempoEstudoSegundos,
    );
  }
}
