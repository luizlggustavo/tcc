export type TipoConteudoLicao = 'texto' | 'video' | 'pdf' | 'link';

export interface IConteudoLicao {
  id: string;
  tipo: TipoConteudoLicao;
  titulo?: string | null;
  texto?: string | null;
  url?: string | null;
  ordem: number;
}

export interface IConteudoLicaoAdministrativo extends IConteudoLicao {
  publicado: boolean;
}

export interface ICriarConteudoLicao {
  tipo: TipoConteudoLicao;
  titulo?: string | null;
  texto?: string | null;
  url?: string | null;
  ordem?: number;
  publicado?: boolean;
}

export interface IAtualizarConteudoLicao {
  tipo?: TipoConteudoLicao;
  titulo?: string | null;
  texto?: string | null;
  url?: string | null;
  ordem?: number;
  publicado?: boolean;
}
