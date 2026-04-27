import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IResumoConquistaUsuario } from '@tcc/interfaces';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConquistasService {
  private readonly http = inject(HttpClient);

  listar(): Observable<IResumoConquistaUsuario[]> {
    return this.http.get<IResumoConquistaUsuario[]>('/api/conquistas');
  }
}
