import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { AtualizarPerfilDto } from './dto/atualizar-perfil.dto';
import { UsuarioService } from './usuario.service';

interface RequisicaoAutenticada {
  user: {
    id: string;
  };
}

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get('me')
  buscarMeuPerfil(@Req() requisicao: RequisicaoAutenticada) {
    return this.usuarioService.buscarPerfil(requisicao.user.id);
  }

  @Patch('me')
  atualizarMeuPerfil(
    @Req() requisicao: RequisicaoAutenticada,
    @Body() dto: AtualizarPerfilDto,
  ) {
    return this.usuarioService.atualizarPerfil(requisicao.user.id, dto);
  }
}
