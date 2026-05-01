import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PapeisGuard } from './papeis.guard';

describe('PapeisGuard', () => {
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let guard: PapeisGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new PapeisGuard(reflector as unknown as Reflector);
  });

  it('deve liberar rota sem papel exigido', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(criarContexto('estudante'))).toBe(true);
  });

  it('deve liberar administrador em rota administrativa', () => {
    reflector.getAllAndOverride.mockReturnValue(['administrador']);

    expect(guard.canActivate(criarContexto('administrador'))).toBe(true);
  });

  it('deve bloquear estudante em rota administrativa', () => {
    reflector.getAllAndOverride.mockReturnValue(['administrador']);

    expect(() => guard.canActivate(criarContexto('estudante'))).toThrow(
      ForbiddenException,
    );
  });
});

function criarContexto(papel?: 'estudante' | 'administrador'): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: papel ? { papel } : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}
