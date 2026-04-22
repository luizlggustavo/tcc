import { ICategoriaTrilha } from './categoria-trilha.interface';
import { IModuloAdministrativo, IResumoModulo } from './modulo.interface';
import { IProgressoTrilha } from './progresso.interface';

export interface IResumoTrilha {
  id: string;
  titulo: string;
  descricaoResumo: string;
  categoria: ICategoriaTrilha;
}

export interface IDetalheTrilha extends IResumoTrilha {
  descricao: string;
  progresso: IProgressoTrilha;
  modulos: IResumoModulo[];
}

export interface IResumoTrilhaAdministrativa {
  id: string;
  titulo: string;
  descricao: string;
  descricaoResumo: string;
  categoria: ICategoriaTrilha;
  publicada: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface IDetalheTrilhaAdministrativa
  extends IResumoTrilhaAdministrativa {
  modulos: IModuloAdministrativo[];
}

export interface ICriarTrilha {
  titulo: string;
  descricao: string;
  descricaoResumo: string;
  categoriaId: string;
  publicada?: boolean;
}

export interface IAtualizarTrilha {
  titulo?: string;
  descricao?: string;
  descricaoResumo?: string;
  categoriaId?: string;
  publicada?: boolean;
}
