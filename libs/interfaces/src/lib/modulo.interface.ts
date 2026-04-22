import { ILicaoAdministrativa, IResumoLicao } from './licao.interface';

export interface IResumoModulo {
  id: string;
  titulo: string;
  ordem: number;
  licoes: IResumoLicao[];
}

export interface IModuloAdministrativo {
  id: string;
  titulo: string;
  ordem: number;
  publicado: boolean;
  licoes: ILicaoAdministrativa[];
}

export interface ICriarModulo {
  titulo: string;
  ordem?: number;
  publicado?: boolean;
}

export interface IAtualizarModulo {
  titulo?: string;
  ordem?: number;
  publicado?: boolean;
}
