export type TipoMissao = 'diaria' | 'semanal' | 'unica';
export type StatusMissao =
  | 'disponivel'
  | 'em_andamento'
  | 'concluida'
  | 'expirada';

export interface IMissao {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoMissao;
  xpRecompensa: number;
  objetivo: string;
  ativa: boolean;
  inicioEm?: Date | null;
  fimEm?: Date | null;
  criadoEm: Date;
}

export interface ICriarMissao {
  titulo: string;
  descricao: string;
  tipo: TipoMissao;
  xpRecompensa: number;
  objetivo: string;
  ativa?: boolean;
  inicioEm?: Date | string | null;
  fimEm?: Date | string | null;
}

export interface IAtualizarMissao {
  titulo?: string;
  descricao?: string;
  tipo?: TipoMissao;
  xpRecompensa?: number;
  objetivo?: string;
  ativa?: boolean;
  inicioEm?: Date | string | null;
  fimEm?: Date | string | null;
}

export interface IMissaoUsuario {
  id: string;
  missaoId: string;
  usuarioId: string;
  status: StatusMissao;
  cicloReferencia: string;
  iniciadoEm?: Date | null;
  concluidoEm?: Date | null;
}

export interface IResumoMissaoUsuario {
  missao: IMissao;
  status: StatusMissao;
  cicloReferencia: string;
  iniciadoEm?: Date | null;
  concluidoEm?: Date | null;
}

export interface IResultadoConclusaoMissao {
  missaoUsuario: IMissaoUsuario;
  eventoXp: import('./progresso.interface').IEventoXp | null;
  conquistasDesbloqueadas: import('./conquista.interface').IConquistaUsuario[];
}
