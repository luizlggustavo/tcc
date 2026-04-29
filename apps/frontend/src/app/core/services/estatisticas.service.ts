import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  AgrupamentoEstatisticas,
  ILinhaEstatisticaAgregada,
} from '@tcc/interfaces';
import { Observable } from 'rxjs';

interface FiltrosEstatisticas {
  inicio: Date;
  fim: Date;
  agrupamento: AgrupamentoEstatisticas;
}

@Injectable({ providedIn: 'root' })
export class EstatisticasService {
  private readonly http = inject(HttpClient);

  registrarAcesso(): Observable<void> {
    return this.http.post<void>('/api/estatisticas/acessos', {});
  }

  consultarAgregado(
    filtros: FiltrosEstatisticas,
  ): Observable<ILinhaEstatisticaAgregada[]> {
    return this.http.get<ILinhaEstatisticaAgregada[]>(
      '/api/estatisticas/uso/agregado',
      { params: this.criarParametros(filtros) },
    );
  }

  exportarCsv(filtros: FiltrosEstatisticas): Observable<Blob> {
    return this.http.get('/api/estatisticas/exportacao.csv', {
      params: this.criarParametros(filtros),
      responseType: 'blob',
    });
  }

  private criarParametros(filtros: FiltrosEstatisticas): HttpParams {
    return new HttpParams()
      .set('inicio', filtros.inicio.toISOString())
      .set('fim', filtros.fim.toISOString())
      .set('agrupamento', filtros.agrupamento);
  }
}
