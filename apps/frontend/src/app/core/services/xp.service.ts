import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IEventoXp } from '@tcc/interfaces';
import { Observable } from 'rxjs';

interface FiltrosHistoricoXp {
  inicio?: Date;
  fim?: Date;
}

@Injectable({ providedIn: 'root' })
export class XpService {
  private readonly http = inject(HttpClient);

  listarHistorico(filtros: FiltrosHistoricoXp = {}): Observable<IEventoXp[]> {
    let parametros = new HttpParams();

    if (filtros.inicio) {
      parametros = parametros.set('inicio', filtros.inicio.toISOString());
    }

    if (filtros.fim) {
      parametros = parametros.set('fim', filtros.fim.toISOString());
    }

    return this.http.get<IEventoXp[]>('/api/xp/historico', {
      params: parametros,
    });
  }
}
