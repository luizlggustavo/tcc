import {
  IConteudoLicao,
  IConteudoLicaoAdministrativo,
} from './conteudo.interface';

export interface IResumoLicao {
  id: string;
  titulo: string;
  descricao: string;
  ordem: number;
  concluida: boolean;
}

export interface IDetalheLicao extends IResumoLicao {
  trilha: {
    id: string;
    titulo: string;
  };
  modulo: {
    id: string;
    titulo: string;
  };
  conteudos: IConteudoLicao[];
}

export interface ILicaoAdministrativa {
  id: string;
  titulo: string;
  descricao: string;
  ordem: number;
  publicada: boolean;
  conteudos: IConteudoLicaoAdministrativo[];
}

export interface ICriarLicao {
  titulo: string;
  descricao: string;
  ordem?: number;
  publicada?: boolean;
}

export interface IAtualizarLicao {
  titulo?: string;
  descricao?: string;
  ordem?: number;
  publicada?: boolean;
}
