import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AgrupamentoEstatisticas,
  ILinhaEstatisticaAgregada,
  MetricaEstatistica,
} from '@tcc/interfaces';
import { Repository } from 'typeorm';
import { MissaoUsuario } from '../missoes/entities/missao-usuario.entity';
import { ConclusaoLicao } from '../progresso/entities/conclusao-licao.entity';
import { ProgressoUsuario } from '../progresso/entities/progresso-usuario.entity';
import { SessaoEstudo } from '../progresso/entities/sessao-estudo.entity';
import { HistoricoXp } from '../xp/entities/historico-xp.entity';
import { AcessoUsuario } from './entities/acesso-usuario.entity';

interface FiltrosEstatisticas {
  inicio: Date;
  fim: Date;
  agrupamento: AgrupamentoEstatisticas;
  usuarioId?: string;
}

interface PeriodoEstatisticas {
  inicio: Date;
  fim: Date;
  chave: string;
}

interface LinhaValorPeriodo {
  periodo: string;
  valor: string | number | null;
}

@Injectable()
export class EstatisticasService {
  private readonly formatadorDia = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
    year: 'numeric',
  });

  constructor(
    @InjectRepository(AcessoUsuario)
    private readonly acessosRepository: Repository<AcessoUsuario>,
    @InjectRepository(SessaoEstudo)
    private readonly sessoesRepository: Repository<SessaoEstudo>,
    @InjectRepository(ConclusaoLicao)
    private readonly conclusoesRepository: Repository<ConclusaoLicao>,
    @InjectRepository(HistoricoXp)
    private readonly historicosXpRepository: Repository<HistoricoXp>,
    @InjectRepository(MissaoUsuario)
    private readonly missoesUsuariosRepository: Repository<MissaoUsuario>,
    @InjectRepository(ProgressoUsuario)
    private readonly progressosRepository: Repository<ProgressoUsuario>,
  ) {}

  async registrarAcesso(usuarioId: string): Promise<void> {
    const acesso = this.acessosRepository.create({
      usuarioId,
      acessadoEm: new Date(),
    });

    await this.acessosRepository.save(acesso);
  }

  async consultarDoUsuario(
    usuarioId: string,
    filtros: Omit<FiltrosEstatisticas, 'usuarioId'>,
  ): Promise<ILinhaEstatisticaAgregada[]> {
    return this.consultar({ ...filtros, usuarioId });
  }

  async consultarAgregado(
    filtros: Omit<FiltrosEstatisticas, 'usuarioId'>,
  ): Promise<ILinhaEstatisticaAgregada[]> {
    return this.consultar(filtros);
  }

  async exportarCsv(
    filtros: Omit<FiltrosEstatisticas, 'usuarioId'>,
  ): Promise<string> {
    const linhas = await this.consultarAgregado(filtros);
    const cabecalho = 'periodo_inicio,periodo_fim,metrica,valor';
    const conteudo = linhas.map((linha) =>
      [
        linha.periodoInicio.toISOString(),
        linha.periodoFim.toISOString(),
        linha.metrica,
        linha.valor,
      ].join(','),
    );

    return [cabecalho, ...conteudo].join('\n');
  }

  private async consultar(
    filtros: FiltrosEstatisticas,
  ): Promise<ILinhaEstatisticaAgregada[]> {
    this.validarPeriodo(filtros.inicio, filtros.fim);

    const periodos = this.gerarPeriodos(
      filtros.inicio,
      filtros.fim,
      filtros.agrupamento,
    );
    const linhasPorMetrica = await Promise.all([
      this.contarAcessos(filtros),
      this.contarUsuariosAtivos(filtros),
      this.somarTempoEstudado(filtros),
      this.contarLicoesConcluidas(filtros),
      this.somarXpObtido(filtros),
      this.contarMissoesConcluidas(filtros),
      this.calcularSequenciaMediaAtual(filtros),
    ]);

    const valoresPorMetrica = new Map<MetricaEstatistica, Map<string, number>>(
      linhasPorMetrica,
    );
    const metricas: MetricaEstatistica[] = [
      'acessos',
      'usuarios_ativos',
      'tempo_estudado_segundos',
      'licoes_concluidas',
      'xp_obtido',
      'missoes_concluidas',
      'sequencia_media_atual',
    ];

    return periodos.flatMap((periodo) =>
      metricas.map((metrica) => ({
        periodoInicio: periodo.inicio,
        periodoFim: periodo.fim,
        metrica,
        valor: valoresPorMetrica.get(metrica)?.get(periodo.chave) ?? 0,
      })),
    );
  }

  private async contarAcessos(
    filtros: FiltrosEstatisticas,
  ): Promise<[MetricaEstatistica, Map<string, number>]> {
    const consulta = this.acessosRepository
      .createQueryBuilder('acesso')
      .select(
        this.expressaoPeriodo('acesso.acessadoEm', filtros.agrupamento),
        'periodo',
      )
      .addSelect('COUNT(acesso.id)', 'valor')
      .where('acesso.acessadoEm >= :inicio', { inicio: filtros.inicio })
      .andWhere('acesso.acessadoEm < :fim', { fim: filtros.fim });

    if (filtros.usuarioId) {
      consulta.andWhere('acesso.usuarioId = :usuarioId', {
        usuarioId: filtros.usuarioId,
      });
    }

    const linhas = await consulta
      .groupBy('periodo')
      .getRawMany<LinhaValorPeriodo>();

    return ['acessos', this.mapearValores(linhas)];
  }

  private async contarUsuariosAtivos(
    filtros: FiltrosEstatisticas,
  ): Promise<[MetricaEstatistica, Map<string, number>]> {
    const consulta = this.acessosRepository
      .createQueryBuilder('acesso')
      .select(
        this.expressaoPeriodo('acesso.acessadoEm', filtros.agrupamento),
        'periodo',
      )
      .addSelect('COUNT(DISTINCT acesso.usuarioId)', 'valor')
      .where('acesso.acessadoEm >= :inicio', { inicio: filtros.inicio })
      .andWhere('acesso.acessadoEm < :fim', { fim: filtros.fim });

    if (filtros.usuarioId) {
      consulta.andWhere('acesso.usuarioId = :usuarioId', {
        usuarioId: filtros.usuarioId,
      });
    }

    const linhas = await consulta
      .groupBy('periodo')
      .getRawMany<LinhaValorPeriodo>();

    return ['usuarios_ativos', this.mapearValores(linhas)];
  }

  private async somarTempoEstudado(
    filtros: FiltrosEstatisticas,
  ): Promise<[MetricaEstatistica, Map<string, number>]> {
    const consulta = this.sessoesRepository
      .createQueryBuilder('sessao')
      .select(
        this.expressaoPeriodo('sessao.inicioEm', filtros.agrupamento),
        'periodo',
      )
      .addSelect('COALESCE(SUM(sessao.duracaoSegundos), 0)', 'valor')
      .where('sessao.inicioEm >= :inicio', { inicio: filtros.inicio })
      .andWhere('sessao.inicioEm < :fim', { fim: filtros.fim });

    if (filtros.usuarioId) {
      consulta.andWhere('sessao.usuarioId = :usuarioId', {
        usuarioId: filtros.usuarioId,
      });
    }

    const linhas = await consulta
      .groupBy('periodo')
      .getRawMany<LinhaValorPeriodo>();

    return ['tempo_estudado_segundos', this.mapearValores(linhas)];
  }

  private async contarLicoesConcluidas(
    filtros: FiltrosEstatisticas,
  ): Promise<[MetricaEstatistica, Map<string, number>]> {
    const consulta = this.conclusoesRepository
      .createQueryBuilder('conclusao')
      .select(
        this.expressaoPeriodo('conclusao.concluidaEm', filtros.agrupamento),
        'periodo',
      )
      .addSelect('COUNT(conclusao.id)', 'valor')
      .where('conclusao.concluidaEm >= :inicio', { inicio: filtros.inicio })
      .andWhere('conclusao.concluidaEm < :fim', { fim: filtros.fim });

    if (filtros.usuarioId) {
      consulta.andWhere('conclusao.usuarioId = :usuarioId', {
        usuarioId: filtros.usuarioId,
      });
    }

    const linhas = await consulta
      .groupBy('periodo')
      .getRawMany<LinhaValorPeriodo>();

    return ['licoes_concluidas', this.mapearValores(linhas)];
  }

  private async somarXpObtido(
    filtros: FiltrosEstatisticas,
  ): Promise<[MetricaEstatistica, Map<string, number>]> {
    const consulta = this.historicosXpRepository
      .createQueryBuilder('historico')
      .select(
        this.expressaoPeriodo('historico.criadoEm', filtros.agrupamento),
        'periodo',
      )
      .addSelect('COALESCE(SUM(historico.quantidade), 0)', 'valor')
      .where('historico.criadoEm >= :inicio', { inicio: filtros.inicio })
      .andWhere('historico.criadoEm < :fim', { fim: filtros.fim });

    if (filtros.usuarioId) {
      consulta.andWhere('historico.usuarioId = :usuarioId', {
        usuarioId: filtros.usuarioId,
      });
    }

    const linhas = await consulta
      .groupBy('periodo')
      .getRawMany<LinhaValorPeriodo>();

    return ['xp_obtido', this.mapearValores(linhas)];
  }

  private async contarMissoesConcluidas(
    filtros: FiltrosEstatisticas,
  ): Promise<[MetricaEstatistica, Map<string, number>]> {
    const consulta = this.missoesUsuariosRepository
      .createQueryBuilder('missaoUsuario')
      .select(
        this.expressaoPeriodo('missaoUsuario.concluidoEm', filtros.agrupamento),
        'periodo',
      )
      .addSelect('COUNT(missaoUsuario.id)', 'valor')
      .where('missaoUsuario.status = :status', { status: 'concluida' })
      .andWhere('missaoUsuario.concluidoEm >= :inicio', {
        inicio: filtros.inicio,
      })
      .andWhere('missaoUsuario.concluidoEm < :fim', { fim: filtros.fim });

    if (filtros.usuarioId) {
      consulta.andWhere('missaoUsuario.usuarioId = :usuarioId', {
        usuarioId: filtros.usuarioId,
      });
    }

    const linhas = await consulta
      .groupBy('periodo')
      .getRawMany<LinhaValorPeriodo>();

    return ['missoes_concluidas', this.mapearValores(linhas)];
  }

  private async calcularSequenciaMediaAtual(
    filtros: FiltrosEstatisticas,
  ): Promise<[MetricaEstatistica, Map<string, number>]> {
    const consulta = this.progressosRepository
      .createQueryBuilder('progresso')
      .select('COALESCE(AVG(progresso.sequenciaDias), 0)', 'valor');

    if (filtros.usuarioId) {
      consulta.where('progresso.usuarioId = :usuarioId', {
        usuarioId: filtros.usuarioId,
      });
    }

    const linha = await consulta.getRawOne<{ valor: string | number | null }>();
    const valor = Number(linha?.valor ?? 0);
    const valores = new Map<string, number>();

    for (const periodo of this.gerarPeriodos(
      filtros.inicio,
      filtros.fim,
      filtros.agrupamento,
    )) {
      valores.set(periodo.chave, Number(valor.toFixed(2)));
    }

    return ['sequencia_media_atual', valores];
  }

  private gerarPeriodos(
    inicio: Date,
    fim: Date,
    agrupamento: AgrupamentoEstatisticas,
  ): PeriodoEstatisticas[] {
    const periodos: PeriodoEstatisticas[] = [];
    let atual = this.inicioDoPeriodo(inicio, agrupamento);

    while (atual.getTime() < fim.getTime()) {
      const proximo = this.proximoPeriodo(atual, agrupamento);
      periodos.push({
        inicio: new Date(Math.max(atual.getTime(), inicio.getTime())),
        fim: new Date(Math.min(proximo.getTime(), fim.getTime())),
        chave: this.formatarPeriodo(atual, agrupamento),
      });
      atual = proximo;
    }

    return periodos;
  }

  private inicioDoPeriodo(
    data: Date,
    agrupamento: AgrupamentoEstatisticas,
  ): Date {
    const inicio = new Date(data);
    inicio.setUTCHours(0, 0, 0, 0);

    if (agrupamento === 'semana') {
      const diaSemana = inicio.getUTCDay() || 7;
      inicio.setUTCDate(inicio.getUTCDate() - diaSemana + 1);
    }

    if (agrupamento === 'mes') {
      inicio.setUTCDate(1);
    }

    return inicio;
  }

  private proximoPeriodo(
    data: Date,
    agrupamento: AgrupamentoEstatisticas,
  ): Date {
    const proximo = new Date(data);

    if (agrupamento === 'dia') {
      proximo.setUTCDate(proximo.getUTCDate() + 1);
    } else if (agrupamento === 'semana') {
      proximo.setUTCDate(proximo.getUTCDate() + 7);
    } else {
      proximo.setUTCMonth(proximo.getUTCMonth() + 1);
    }

    return proximo;
  }

  private expressaoPeriodo(
    campo: string,
    agrupamento: AgrupamentoEstatisticas,
  ): string {
    if (agrupamento === 'dia') {
      return `TO_CHAR(DATE_TRUNC('day', ${campo}), 'YYYY-MM-DD')`;
    }

    if (agrupamento === 'semana') {
      return `TO_CHAR(DATE_TRUNC('week', ${campo}), 'YYYY-MM-DD')`;
    }

    return `TO_CHAR(DATE_TRUNC('month', ${campo}), 'YYYY-MM-DD')`;
  }

  private formatarPeriodo(
    data: Date,
    agrupamento: AgrupamentoEstatisticas,
  ): string {
    if (agrupamento === 'mes') {
      return `${data.getUTCFullYear()}-${String(
        data.getUTCMonth() + 1,
      ).padStart(2, '0')}-01`;
    }

    return this.formatadorDia.format(data);
  }

  private mapearValores(linhas: LinhaValorPeriodo[]): Map<string, number> {
    return new Map(
      linhas.map((linha) => [linha.periodo, Number(linha.valor ?? 0)]),
    );
  }

  private validarPeriodo(inicio: Date, fim: Date): void {
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      throw new BadRequestException('Período informado é inválido');
    }

    if (inicio.getTime() >= fim.getTime()) {
      throw new BadRequestException(
        'Data final deve ser posterior à data inicial',
      );
    }
  }
}
