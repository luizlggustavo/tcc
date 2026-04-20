import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AutenticacaoService } from '../services/autenticacao.service';

export const visitanteGuard: CanActivateFn = () => {
  const autenticacao = inject(AutenticacaoService);
  const router = inject(Router);
  if (!autenticacao.estaLogado()) return true;
  return router.createUrlTree(['/app/dashboard']);
};
