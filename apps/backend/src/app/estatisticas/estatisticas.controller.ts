import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Papeis } from '../auth/decorators/papeis.decorator';
import { ConsultarEstatisticasDto } from './dto/consultar-estatisticas.dto';
import { EstatisticasService } from './estatisticas.service';

interface RequisicaoAutenticada {
  user: {
    id: string;
  };
}

@Controller('estatisticas')
export class EstatisticasController {
  constructor(private readonly estatisticasService: EstatisticasService) {}

  @Post('acessos')
  @HttpCode(HttpStatus.NO_CONTENT)
  registrarAcesso(@Req() requisicao: RequisicaoAutenticada) {
    return this.estatisticasService.registrarAcesso(requisicao.user.id);
  }

  @Get('uso/me')
  consultarMeuUso(
    @Req() requisicao: RequisicaoAutenticada,
    @Query() dto: ConsultarEstatisticasDto,
  ) {
    return this.estatisticasService.consultarDoUsuario(requisicao.user.id, {
      inicio: new Date(dto.inicio),
      fim: new Date(dto.fim),
      agrupamento: dto.agrupamento,
    });
  }

  @Get('uso/agregado')
  @Papeis('administrador')
  consultarUsoAgregado(@Query() dto: ConsultarEstatisticasDto) {
    return this.estatisticasService.consultarAgregado({
      inicio: new Date(dto.inicio),
      fim: new Date(dto.fim),
      agrupamento: dto.agrupamento,
    });
  }

  @Get('exportacao.csv')
  @Papeis('administrador')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="estatisticas-tcc.csv"')
  exportarCsv(@Query() dto: ConsultarEstatisticasDto) {
    return this.estatisticasService.exportarCsv({
      inicio: new Date(dto.inicio),
      fim: new Date(dto.fim),
      agrupamento: dto.agrupamento,
    });
  }
}
