import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IRespostaRecuperacaoSenha, IUsuarioResumo } from '@tcc/interfaces';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async hashSenha(senha: string): Promise<string> {
    return bcrypt.hash(senha, 12);
  }

  async validarSenha(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
  }

  gerarToken(usuario: IUsuarioResumo): { access_token: string } {
    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
    };
    return { access_token: this.jwtService.sign(payload) };
  }

  async login(
    usuario: IUsuarioResumo,
    senhaFornecida: string,
    hashSenha: string,
  ): Promise<{ access_token: string }> {
    const senhaValida = await this.validarSenha(senhaFornecida, hashSenha);
    if (!senhaValida) throw new UnauthorizedException('Credenciais inválidas');
    return this.gerarToken(usuario);
  }

  solicitarRecuperacaoSenha(): IRespostaRecuperacaoSenha {
    return {
      mensagem:
        'Se o e-mail informado estiver cadastrado, enviaremos as instruções de recuperação.',
    };
  }
}
