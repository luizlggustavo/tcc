import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IRespostaRanking, TipoRanking } from '@tcc/interfaces';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RankingService {
  private readonly http = inject(HttpClient);

  listar(tipo: TipoRanking): Observable<IRespostaRanking> {
    return tipo === 'geral' ? this.listarGeral() : this.listarSemanal();
  }

  listarGeral(): Observable<IRespostaRanking> {
    return this.http.get<IRespostaRanking>('/api/ranking/geral');
  }

  listarSemanal(): Observable<IRespostaRanking> {
    return this.http.get<IRespostaRanking>('/api/ranking/semanal');
  }
}
