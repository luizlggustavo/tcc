export type TipoRanking = 'geral' | 'semanal';

export interface IEntradaRanking {
  posicao: number;
  usuarioId: string;
  nomeUsuario: string;
  xp: number;
  nivel: number;
  usuarioAtual: boolean;
}

export interface IPeriodoRanking {
  inicio: Date;
  fimExclusivo: Date;
}

export interface IRespostaRanking {
  tipo: TipoRanking;
  limite: number;
  periodo: IPeriodoRanking | null;
  entradas: IEntradaRanking[];
  minhaEntrada: IEntradaRanking | null;
}
