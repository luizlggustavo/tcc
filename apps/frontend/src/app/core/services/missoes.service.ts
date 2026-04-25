import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  IMissaoUsuario,
  IResultadoConclusaoMissao,
  IResumoMissaoUsuario,
  StatusMissao,
} from '@tcc/interfaces';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MissoesService {
  private readonly http = inject(HttpClient);

  listar(status?: StatusMissao): Observable<IResumoMissaoUsuario[]> {
    const parametros = status
      ? new HttpParams().set('status', status)
      : undefined;

    return this.http.get<IResumoMissaoUsuario[]>('/api/missoes', {
      params: parametros,
    });
  }

  iniciar(missaoId: string): Observable<IMissaoUsuario> {
    return this.http.post<IMissaoUsuario>(
      `/api/missoes/${missaoId}/iniciar`,
      {},
    );
  }

  concluir(missaoId: string): Observable<IResultadoConclusaoMissao> {
    return this.http.post<IResultadoConclusaoMissao>(
      `/api/missoes/${missaoId}/concluir`,
      {},
    );
  }
}
