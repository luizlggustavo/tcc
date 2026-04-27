export type TipoCriterioConquista =
  | 'licoes_concluidas'
  | 'xp_total'
  | 'sequencia_dias'
  | 'missoes_concluidas';

export interface IConquista {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  icone: string;
  xpRecompensa: number;
  tipoCriterio: TipoCriterioConquista;
  valorCriterio: number;
  criterio: string;
  ativa: boolean;
}

export interface ICriarConquista {
  codigo: string;
  titulo: string;
  descricao: string;
  icone: string;
  xpRecompensa?: number;
  tipoCriterio: TipoCriterioConquista;
  valorCriterio: number;
  criterio: string;
  ativa?: boolean;
}

export interface IAtualizarConquista {
  codigo?: string;
  titulo?: string;
  descricao?: string;
  icone?: string;
  xpRecompensa?: number;
  tipoCriterio?: TipoCriterioConquista;
  valorCriterio?: number;
  criterio?: string;
  ativa?: boolean;
}

export interface IConquistaUsuario {
  id: string;
  conquistaId: string;
  usuarioId: string;
  conquistadoEm: Date;
}

export interface IResumoConquistaUsuario {
  conquista: IConquista;
  desbloqueada: boolean;
  conquistadoEm: Date | null;
}
