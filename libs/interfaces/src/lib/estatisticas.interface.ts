export type AgrupamentoEstatisticas = 'dia' | 'semana' | 'mes';

export type MetricaEstatistica =
  | 'acessos'
  | 'usuarios_ativos'
  | 'tempo_estudado_segundos'
  | 'licoes_concluidas'
  | 'xp_obtido'
  | 'missoes_concluidas'
  | 'sequencia_media_atual';

export interface ILinhaEstatisticaAgregada {
  periodoInicio: Date;
  periodoFim: Date;
  metrica: MetricaEstatistica;
  valor: number;
}
