export interface IResumoProgresso {
  xpTotal: number;
  nivel: number;
  sequenciaDias: number;
}

export interface IProgressoTrilha {
  trilhaId: string;
  totalLicoes: number;
  licoesConcluidas: number;
  percentualConclusao: number;
}

export interface IRegistroTempoEstudo {
  usuarioId: string;
  trilhaId: string;
  licaoId: string;
  inicioEm: Date;
  fimEm: Date;
  duracaoSegundos: number;
}

export type TipoOrigemXp = 'conclusao_licao' | 'conclusao_missao';

export interface IEventoXp {
  id: string;
  usuarioId: string;
  quantidade: number;
  tipoOrigem: TipoOrigemXp;
  referenciaOrigemId: string;
  xpTotalAposEvento: number;
  nivelAposEvento: number;
  criadoEm: Date;
}

export interface IResultadoConclusaoLicao {
  licaoId: string;
  concluida: boolean;
  concluidaEm: Date;
  progressoTrilha: IProgressoTrilha;
  progressoUsuario: IResumoProgresso;
  tempoEstudo: IRegistroTempoEstudo | null;
  eventoXp: IEventoXp | null;
  conquistasDesbloqueadas: import('./conquista.interface').IConquistaUsuario[];
}

export interface IProgresso {
  usuarioId: string;
  xpTotal: number;
  nivel: number;
  sequenciaDias: number;
  ultimoAcessoEm?: Date | null;
}
