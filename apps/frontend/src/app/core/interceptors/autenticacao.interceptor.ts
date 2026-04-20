import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AutenticacaoService } from '../services/autenticacao.service';

export const interceptorAutenticacao: HttpInterceptorFn = (req, next) => {
  const autenticacao = inject(AutenticacaoService);
  const token = autenticacao.token();
  const requisicao = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(requisicao).pipe(
    catchError((erro: unknown) => {
      if (erro instanceof HttpErrorResponse && erro.status === 401) {
        autenticacao.logout();
      }

      return throwError(() => erro);
    }),
  );
};
