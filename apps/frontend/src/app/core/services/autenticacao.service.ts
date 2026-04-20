import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { throwError, Observable } from 'rxjs';
import {
  IAtualizarPerfil,
  IPerfilUsuario,
  IRespostaRecuperacaoSenha,
  IResumoProgresso,
  ITokenResposta,
  IUsuarioResumo,
} from '@tcc/interfaces';

interface JwtPayload {
  sub: string;
  email: string;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AutenticacaoService {
  private readonly TOKEN_KEY = 'tcc_token';
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(
    sessionStorage.getItem(this.TOKEN_KEY),
  );
  private readonly _perfilAtual = signal<IPerfilUsuario | null>(null);

  readonly token = this._token.asReadonly();
  readonly perfilAtual = this._perfilAtual.asReadonly();

  readonly estaLogado = computed(() => {
    const token = this._token();
    if (!token) return false;
    try {
      const payload = this.decodificarToken(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  });

  readonly usuarioAtual = computed<IUsuarioResumo | null>(() => {
    if (!this.estaLogado()) return null;
    return this._perfilAtual()?.usuario ?? null;
  });

  login(email: string, senha: string): Observable<ITokenResposta> {
    return this.http
      .post<ITokenResposta>('/api/auth/login', { email, password: senha })
      .pipe(
        tap(({ access_token }) => this.salvarToken(access_token)),
        catchError((err) => throwError(() => err)),
      );
  }

  registrar(
    nome: string,
    email: string,
    senha: string,
  ): Observable<ITokenResposta> {
    return this.http
      .post<ITokenResposta>('/api/auth/register', {
        nome,
        email,
        password: senha,
      })
      .pipe(
        tap(({ access_token }) => this.salvarToken(access_token)),
        catchError((err) => throwError(() => err)),
      );
  }

  carregarPerfil(): Observable<IPerfilUsuario> {
    return this.http.get<IPerfilUsuario>('/api/usuarios/me').pipe(
      tap((perfil) => this._perfilAtual.set(perfil)),
      catchError((err) => throwError(() => err)),
    );
  }

  atualizarPerfil(dados: IAtualizarPerfil): Observable<IPerfilUsuario> {
    return this.http.patch<IPerfilUsuario>('/api/usuarios/me', dados).pipe(
      tap((perfil) => this._perfilAtual.set(perfil)),
      catchError((err) => throwError(() => err)),
    );
  }

  atualizarProgressoAtual(progresso: Partial<IResumoProgresso>): void {
    this._perfilAtual.update((perfil) =>
      perfil
        ? {
            ...perfil,
            progresso: {
              ...perfil.progresso,
              ...progresso,
            },
          }
        : perfil,
    );
  }

  recuperarSenha(email: string): Observable<IRespostaRecuperacaoSenha> {
    return this.http
      .post<IRespostaRecuperacaoSenha>('/api/auth/recuperar-senha', { email })
      .pipe(catchError((err) => throwError(() => err)));
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    this._token.set(null);
    this._perfilAtual.set(null);
    this.router.navigate(['/login']);
  }

  private salvarToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    this._token.set(token);
    this._perfilAtual.set(null);
  }

  private decodificarToken(token: string): JwtPayload {
    const parte = token.split('.')[1];
    return JSON.parse(atob(parte));
  }
}
