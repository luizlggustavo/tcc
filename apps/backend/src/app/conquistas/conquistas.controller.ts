import { Controller, Get, Req } from '@nestjs/common';
import { ConquistasService } from './conquistas.service';

interface RequisicaoAutenticada {
  user: {
    id: string;
  };
}

@Controller('conquistas')
export class ConquistasController {
  constructor(private readonly conquistasService: ConquistasService) {}

  @Get()
  listar(@Req() requisicao: RequisicaoAutenticada) {
    return this.conquistasService.listarDoUsuario(requisicao.user.id);
  }
}
