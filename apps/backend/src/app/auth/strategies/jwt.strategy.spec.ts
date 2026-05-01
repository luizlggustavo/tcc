import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { UsuarioService } from '../../usuario/usuario.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let usuarioService: jest.Mocked<Pick<UsuarioService, 'buscarAutenticado'>>;
  let strategy: JwtStrategy;

  beforeEach(() => {
    usuarioService = {
      buscarAutenticado: jest.fn(),
    };
    strategy = new JwtStrategy(
      { get: jest.fn().mockReturnValue('segredo') } as unknown as ConfigService,
      usuarioService as unknown as UsuarioService,
    );
  });

  it('deve retornar usuário ativo validado pelo banco', async () => {
    usuarioService.buscarAutenticado.mockResolvedValue({
      id: 'usuario-1',
      nome: 'Ana Silva',
      email: 'ana@email.com',
      papel: 'administrador',
      status: 'ativo',
    });

    await expect(
      strategy.validate({ sub: 'usuario-1', email: 'ana@email.com' }),
    ).resolves.toEqual({
      id: 'usuario-1',
      email: 'ana@email.com',
      papel: 'administrador',
      status: 'ativo',
    });
  });

  it('deve rejeitar usuário inativo ou inexistente', async () => {
    usuarioService.buscarAutenticado.mockRejectedValue(
      new UnauthorizedException('Usuário inativo ou inexistente'),
    );

    await expect(
      strategy.validate({ sub: 'usuario-1', email: 'ana@email.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
