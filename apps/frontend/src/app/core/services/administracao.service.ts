import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  IAtualizarCategoriaTrilha,
  IAtualizarConquista,
  IAtualizarConteudoLicao,
  IAtualizarLicao,
  IAtualizarMissao,
  IAtualizarModulo,
  IAtualizarTrilha,
  IAtualizarUsuarioAdministrativo,
  ICategoriaTrilha,
  IConquista,
  IConteudoLicaoAdministrativo,
  ICriarCategoriaTrilha,
  ICriarConquista,
  ICriarConteudoLicao,
  ICriarLicao,
  ICriarMissao,
  ICriarModulo,
  ICriarTrilha,
  IDetalheTrilhaAdministrativa,
  ILicaoAdministrativa,
  IMissao,
  IModuloAdministrativo,
  IResumoTrilhaAdministrativa,
  IUsuario,
} from '@tcc/interfaces';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdministracaoService {
  private readonly http = inject(HttpClient);

  listarUsuarios(): Observable<IUsuario[]> {
    return this.http.get<IUsuario[]>('/api/admin/usuarios');
  }

  atualizarUsuario(
    usuarioId: string,
    dados: IAtualizarUsuarioAdministrativo,
  ): Observable<IUsuario> {
    return this.http.patch<IUsuario>(`/api/admin/usuarios/${usuarioId}`, dados);
  }

  listarCategorias(): Observable<ICategoriaTrilha[]> {
    return this.http.get<ICategoriaTrilha[]>('/api/admin/categorias-trilhas');
  }

  criarCategoria(dados: ICriarCategoriaTrilha): Observable<ICategoriaTrilha> {
    return this.http.post<ICategoriaTrilha>(
      '/api/admin/categorias-trilhas',
      dados,
    );
  }

  atualizarCategoria(
    categoriaId: string,
    dados: IAtualizarCategoriaTrilha,
  ): Observable<ICategoriaTrilha> {
    return this.http.patch<ICategoriaTrilha>(
      `/api/admin/categorias-trilhas/${categoriaId}`,
      dados,
    );
  }

  listarTrilhas(): Observable<IResumoTrilhaAdministrativa[]> {
    return this.http.get<IResumoTrilhaAdministrativa[]>('/api/admin/trilhas');
  }

  criarTrilha(dados: ICriarTrilha): Observable<IResumoTrilhaAdministrativa> {
    return this.http.post<IResumoTrilhaAdministrativa>(
      '/api/admin/trilhas',
      dados,
    );
  }

  buscarTrilha(trilhaId: string): Observable<IDetalheTrilhaAdministrativa> {
    return this.http.get<IDetalheTrilhaAdministrativa>(
      `/api/admin/trilhas/${trilhaId}`,
    );
  }

  atualizarTrilha(
    trilhaId: string,
    dados: IAtualizarTrilha,
  ): Observable<IResumoTrilhaAdministrativa> {
    return this.http.patch<IResumoTrilhaAdministrativa>(
      `/api/admin/trilhas/${trilhaId}`,
      dados,
    );
  }

  criarModulo(
    trilhaId: string,
    dados: ICriarModulo,
  ): Observable<IModuloAdministrativo> {
    return this.http.post<IModuloAdministrativo>(
      `/api/admin/trilhas/${trilhaId}/modulos`,
      dados,
    );
  }

  atualizarModulo(
    moduloId: string,
    dados: IAtualizarModulo,
  ): Observable<IModuloAdministrativo> {
    return this.http.patch<IModuloAdministrativo>(
      `/api/admin/modulos/${moduloId}`,
      dados,
    );
  }

  criarLicao(
    moduloId: string,
    dados: ICriarLicao,
  ): Observable<ILicaoAdministrativa> {
    return this.http.post<ILicaoAdministrativa>(
      `/api/admin/modulos/${moduloId}/licoes`,
      dados,
    );
  }

  atualizarLicao(
    licaoId: string,
    dados: IAtualizarLicao,
  ): Observable<ILicaoAdministrativa> {
    return this.http.patch<ILicaoAdministrativa>(
      `/api/admin/licoes/${licaoId}`,
      dados,
    );
  }

  criarConteudo(
    licaoId: string,
    dados: ICriarConteudoLicao,
  ): Observable<IConteudoLicaoAdministrativo> {
    return this.http.post<IConteudoLicaoAdministrativo>(
      `/api/admin/licoes/${licaoId}/conteudos`,
      dados,
    );
  }

  atualizarConteudo(
    conteudoId: string,
    dados: IAtualizarConteudoLicao,
  ): Observable<IConteudoLicaoAdministrativo> {
    return this.http.patch<IConteudoLicaoAdministrativo>(
      `/api/admin/conteudos/${conteudoId}`,
      dados,
    );
  }

  listarMissoes(): Observable<IMissao[]> {
    return this.http.get<IMissao[]>('/api/admin/missoes');
  }

  criarMissao(dados: ICriarMissao): Observable<IMissao> {
    return this.http.post<IMissao>('/api/admin/missoes', dados);
  }

  atualizarMissao(
    missaoId: string,
    dados: IAtualizarMissao,
  ): Observable<IMissao> {
    return this.http.patch<IMissao>(`/api/admin/missoes/${missaoId}`, dados);
  }

  listarConquistas(): Observable<IConquista[]> {
    return this.http.get<IConquista[]>('/api/admin/conquistas');
  }

  criarConquista(dados: ICriarConquista): Observable<IConquista> {
    return this.http.post<IConquista>('/api/admin/conquistas', dados);
  }

  atualizarConquista(
    conquistaId: string,
    dados: IAtualizarConquista,
  ): Observable<IConquista> {
    return this.http.patch<IConquista>(
      `/api/admin/conquistas/${conquistaId}`,
      dados,
    );
  }
}
