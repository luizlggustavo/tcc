import { IResumoProgresso } from './progresso.interface';

export type PapelUsuario = 'estudante' | 'administrador';
export type StatusUsuario = 'ativo' | 'inativo';

export interface IUsuario {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  status: StatusUsuario;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface IUsuarioResumo {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  status: StatusUsuario;
}

export interface IPerfilUsuario {
  usuario: IUsuarioResumo;
  progresso: IResumoProgresso;
}

export interface IAtualizarPerfil {
  nome?: string;
  email?: string;
}

export interface IAtualizarUsuarioAdministrativo {
  nome?: string;
  email?: string;
  papel?: PapelUsuario;
  status?: StatusUsuario;
}
