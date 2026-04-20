import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { UsuarioService } from '../usuario/usuario.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RecuperarSenhaDto } from './dto/recuperar-senha.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuarioService: UsuarioService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const usuario = await this.usuarioService.registrar(dto);
    return this.authService.gerarToken(usuario);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const usuario = await this.usuarioService.buscarPorEmail(dto.email);
    if (usuario.status !== 'ativo') {
      throw new UnauthorizedException('Usuário inativo');
    }

    return this.authService.login(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        status: usuario.status,
      },
      dto.password,
      usuario.hashSenha,
    );
  }

  @Public()
  @Post('recuperar-senha')
  @HttpCode(HttpStatus.OK)
  recuperarSenha(@Body() dto: RecuperarSenhaDto) {
    void dto.email;
    return this.authService.solicitarRecuperacaoSenha();
  }
}
