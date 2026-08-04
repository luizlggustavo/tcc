import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { IPerfilUsuario, IUsuarioResumo } from '@tcc/interfaces';
import { of } from 'rxjs';
import { AutenticacaoService } from '../services/autenticacao.service';
import { administradorGuard } from './administrador.guard';

describe('administradorGuard', () => {
  let router: Router;
  let logado: WritableSignal<boolean>;
  let usuarioAtual: WritableSignal<IUsuarioResumo | null>;
  let autenticacaoService: {
    estaLogado: () => boolean;
    usuarioAtual: () => IUsuarioResumo | null;
    carregarPerfil: jest.Mock;
  };

  beforeEach(() => {
    logado = signal(true);
    usuarioAtual = signal(criarUsuario('administrador'));
    autenticacaoService = {
      estaLogado: logado.asReadonly(),
      usuarioAtual: usuarioAtual.asReadonly(),
      carregarPerfil: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AutenticacaoService, useValue: autenticacaoService },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('deve liberar administrador autenticado', () => {
    const resultado = executarGuard();

    expect(resultado).toBe(true);
  });

  it('deve redirecionar estudante para dashboard', () => {
    usuarioAtual.set(criarUsuario('estudante'));

    const resultado = executarGuard() as UrlTree;

    expect(router.serializeUrl(resultado)).toBe('/app/dashboard');
  });

  it('deve redirecionar visitante para login', () => {
    logado.set(false);
    usuarioAtual.set(null);

    const resultado = executarGuard() as UrlTree;

    expect(router.serializeUrl(resultado)).toBe('/login');
  });

  it('deve carregar perfil quando usuário atual ainda não está disponível', (done) => {
    usuarioAtual.set(null);
    autenticacaoService.carregarPerfil.mockReturnValue(
      of({
        usuario: criarUsuario('administrador'),
        progresso: { xpTotal: 0, nivel: 1, sequenciaDias: 0 },
      } satisfies IPerfilUsuario),
    );
    const resultado = executarGuard();

    if (typeof resultado === 'boolean' || resultado instanceof UrlTree) {
      throw new Error('Resultado deveria ser Observable');
    }

    resultado.subscribe((valor) => {
      expect(valor).toBe(true);
      done();
    });
  });
});

function executarGuard() {
  return TestBed.runInInjectionContext(() =>
    administradorGuard({} as never, {} as never),
  );
}

function criarUsuario(papel: 'estudante' | 'administrador'): IUsuarioResumo {
  return {
    id: 'usuario-1',
    nome: 'Ana Silva',
    email: 'ana@email.com',
    papel,
    status: 'ativo',
  };
}
