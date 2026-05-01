import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService({ sign: jest.fn() } as unknown as JwtService);
  });

  it('deve retornar mensagem neutra ao solicitar recuperação de senha', () => {
    const resposta = service.solicitarRecuperacaoSenha();

    expect(resposta.mensagem).toBe(
      'Se o e-mail informado estiver cadastrado, enviaremos as instruções de recuperação.',
    );
  });
});
