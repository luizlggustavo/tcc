import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  IDetalheLicao,
  IDetalheTrilha,
  IProgressoTrilha,
  IResultadoConclusaoLicao,
  IResumoTrilha,
} from '@tcc/interfaces';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TrilhasService {
  private readonly http = inject(HttpClient);

  listarPublicadas(): Observable<IResumoTrilha[]> {
    return this.http.get<IResumoTrilha[]>('/api/trilhas');
  }

  buscarDetalhe(trilhaId: string): Observable<IDetalheTrilha> {
    return this.http.get<IDetalheTrilha>(`/api/trilhas/${trilhaId}`);
  }

  buscarProgresso(trilhaId: string): Observable<IProgressoTrilha> {
    return this.http.get<IProgressoTrilha>(
      `/api/trilhas/${trilhaId}/progresso`,
    );
  }

  buscarLicao(trilhaId: string, licaoId: string): Observable<IDetalheLicao> {
    return this.http.get<IDetalheLicao>(
      `/api/trilhas/${trilhaId}/licoes/${licaoId}`,
    );
  }

  concluirLicao(
    trilhaId: string,
    licaoId: string,
    tempoEstudoSegundos: number,
  ): Observable<IResultadoConclusaoLicao> {
    return this.http.post<IResultadoConclusaoLicao>(
      `/api/trilhas/${trilhaId}/licoes/${licaoId}/concluir`,
      { tempoEstudoSegundos },
    );
  }
}
