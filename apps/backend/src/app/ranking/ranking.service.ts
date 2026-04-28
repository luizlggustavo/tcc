import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IEntradaRanking,
  IRespostaRanking,
  TipoRanking,
} from '@tcc/interfaces';
import { Repository } from 'typeorm';
import { HistoricoXp } from '../xp/entities/historico-xp.entity';
import { ProgressoUsuario } from '../progresso/entities/progresso-usuario.entity';
import { Usuario } from '../usuario/entities/usuario.entity';

interface DadosRanking {
  usuarioId: string;
  nomeUsuario: string;
  xp: number;
  nivel: number;
}

interface SomaXpSemanal {
  usuarioId: string;
  xp: string | number | null;
}

@Injectable()
export class RankingService {
  private static readonly LIMITE_PADRAO = 50;

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(ProgressoUsuario)
    private readonly progressoRepository: Repository<ProgressoUsuario>,
    @InjectRepository(HistoricoXp)
    private readonly historicoRepository: Repository<HistoricoXp>,
  ) {}

  async listarGeral(usuarioAtualId: string): Promise<IRespostaRanking> {
    const dados = await this.obterDadosBase();

    return this.montarResposta('geral', usuarioAtualId, null, dados);
  }

  async listarSemanal(usuarioAtualId: string): Promise<IRespostaRanking> {
    const periodo = this.calcularPeriodoSemanal();
    const [dadosBase, somasSemanais] = await Promise.all([
      this.obterDadosBase(),
      this.somarXpSemanal(periodo.inicio, periodo.fimExclusivo),
    ]);
    const xpPorUsuario = new Map(
      somasSemanais.map((soma) => [soma.usuarioId, Number(soma.xp ?? 0)]),
    );
    const dados = dadosBase.map((usuario) => ({
      ...usuario,
      xp: xpPorUsuario.get(usuario.usuarioId) ?? 0,
    }));

    return this.montarResposta('semanal', usuarioAtualId, periodo, dados);
  }

  private async obterDadosBase(): Promise<DadosRanking[]> {
    const [usuarios, progressos] = await Promise.all([
      this.usuarioRepository.find({ order: { nome: 'ASC', id: 'ASC' } }),
      this.progressoRepository.find(),
    ]);
    const progressoPorUsuario = new Map(
      progressos.map((progresso) => [progresso.usuarioId, progresso]),
    );

    return usuarios.map((usuario) => {
      const progresso = progressoPorUsuario.get(usuario.id);

      return {
        usuarioId: usuario.id,
        nomeUsuario: usuario.nome,
        xp: progresso?.xpTotal ?? 0,
        nivel: progresso?.nivel ?? 1,
      };
    });
  }

  private somarXpSemanal(
    inicio: Date,
    fimExclusivo: Date,
  ): Promise<SomaXpSemanal[]> {
    return this.historicoRepository
      .createQueryBuilder('historico')
      .select('historico.usuarioId', 'usuarioId')
      .addSelect('SUM(historico.quantidade)', 'xp')
      .where('historico.criadoEm >= :inicio', { inicio })
      .andWhere('historico.criadoEm < :fimExclusivo', { fimExclusivo })
      .groupBy('historico.usuarioId')
      .getRawMany<SomaXpSemanal>();
  }

  private montarResposta(
    tipo: TipoRanking,
    usuarioAtualId: string,
    periodo: IRespostaRanking['periodo'],
    dados: DadosRanking[],
  ): IRespostaRanking {
    const ranking = [...dados]
      .sort((a, b) => this.compararEntradas(a, b))
      .map<IEntradaRanking>((entrada, indice) => ({
        posicao: indice + 1,
        usuarioId: entrada.usuarioId,
        nomeUsuario: entrada.nomeUsuario,
        xp: entrada.xp,
        nivel: entrada.nivel,
        usuarioAtual: entrada.usuarioId === usuarioAtualId,
      }));

    return {
      tipo,
      limite: RankingService.LIMITE_PADRAO,
      periodo,
      entradas: ranking.slice(0, RankingService.LIMITE_PADRAO),
      minhaEntrada:
        ranking.find((entrada) => entrada.usuarioId === usuarioAtualId) ?? null,
    };
  }

  private compararEntradas(a: DadosRanking, b: DadosRanking): number {
    if (a.xp !== b.xp) return b.xp - a.xp;

    const comparacaoNome = a.nomeUsuario.localeCompare(b.nomeUsuario, 'pt-BR');
    if (comparacaoNome !== 0) return comparacaoNome;

    return a.usuarioId.localeCompare(b.usuarioId, 'pt-BR');
  }

  private calcularPeriodoSemanal(): IRespostaRanking['periodo'] {
    const inicio = new Date();
    const diasDesdeSegunda = (inicio.getDay() + 6) % 7;
    inicio.setHours(0, 0, 0, 0);
    inicio.setDate(inicio.getDate() - diasDesdeSegunda);

    const fimExclusivo = new Date(inicio);
    fimExclusivo.setDate(fimExclusivo.getDate() + 7);

    return { inicio, fimExclusivo };
  }
}
