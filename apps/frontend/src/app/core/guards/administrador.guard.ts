import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AutenticacaoService } from '../services/autenticacao.service';

export const administradorGuard: CanActivateFn = () => {
  const autenticacao = inject(AutenticacaoService);
  const router = inject(Router);

  if (!autenticacao.estaLogado()) return router.createUrlTree(['/login']);

  const usuario = autenticacao.usuarioAtual();
  if (usuario) {
    return usuario.papel === 'administrador'
      ? true
      : router.createUrlTree(['/app/dashboard']);
  }

  return autenticacao.carregarPerfil().pipe(
    map((perfil) =>
      perfil.usuario.papel === 'administrador'
        ? true
        : router.createUrlTree(['/app/dashboard']),
    ),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
