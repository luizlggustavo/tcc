import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IConquista,
  IConquistaUsuario,
  IResumoConquistaUsuario,
  TipoCriterioConquista,
} from '@tcc/interfaces';
import { In, Repository } from 'typeorm';
import { MissaoUsuario } from '../missoes/entities/missao-usuario.entity';
import { ConclusaoLicao } from '../progresso/entities/conclusao-licao.entity';
import { ProgressoUsuario } from '../progresso/entities/progresso-usuario.entity';
import { ConquistaUsuario } from './entities/conquista-usuario.entity';
import { Conquista } from './entities/conquista.entity';

interface DefinicaoConquista {
  codigo: string;
  titulo: string;
  descricao: string;
  icone: string;
  xpRecompensa: number;
  tipoCriterio: TipoCriterioConquista;
  valorCriterio: number;
  criterio: string;
}

interface IndicadoresConquista {
  licoesConcluidas: number;
  xpTotal: number;
  sequenciaDias: number;
  missoesConcluidas: number;
}

@Injectable()
export class ConquistasService {
  private readonly conquistasPadrao: DefinicaoConquista[] = [
    {
      codigo: 'primeira-licao',
      titulo: 'Primeira lição',
      descricao: 'Concluiu a primeira lição da jornada.',
      icone: 'estrela',
      xpRecompensa: 0,
      tipoCriterio: 'licoes_concluidas',
      valorCriterio: 1,
      criterio: 'Concluir 1 lição.',
    },
    {
      codigo: 'dez-licoes',
      titulo: 'Ritmo de estudo',
      descricao: 'Concluiu dez lições.',
      icone: 'livro',
      xpRecompensa: 0,
      tipoCriterio: 'licoes_concluidas',
      valorCriterio: 10,
      criterio: 'Concluir 10 lições.',
    },
    {
      codigo: 'cem-xp',
      titulo: '100 XP',
      descricao: 'Alcançou 100 XP acumulados.',
      icone: 'trofeu',
      xpRecompensa: 0,
      tipoCriterio: 'xp_total',
      valorCriterio: 100,
      criterio: 'Acumular 100 XP.',
    },
    {
      codigo: 'sequencia-tres-dias',
      titulo: 'Três dias seguidos',
      descricao: 'Manteve uma sequência de três dias de estudo.',
      icone: 'fogo',
      xpRecompensa: 0,
      tipoCriterio: 'sequencia_dias',
      valorCriterio: 3,
      criterio: 'Manter sequência ativa de 3 dias.',
    },
    {
      codigo: 'primeira-missao',
      titulo: 'Missão cumprida',
      descricao: 'Concluiu a primeira missão.',
      icone: 'medalha',
      xpRecompensa: 0,
      tipoCriterio: 'missoes_concluidas',
      valorCriterio: 1,
      criterio: 'Concluir 1 missão.',
    },
  ];

  constructor(
    @InjectRepository(Conquista)
    private readonly conquistasRepository: Repository<Conquista>,
    @InjectRepository(ConquistaUsuario)
    private readonly conquistasUsuariosRepository: Repository<ConquistaUsuario>,
    @InjectRepository(ConclusaoLicao)
    private readonly conclusoesRepository: Repository<ConclusaoLicao>,
    @InjectRepository(ProgressoUsuario)
    private readonly progressoRepository: Repository<ProgressoUsuario>,
    @InjectRepository(MissaoUsuario)
    private readonly missoesUsuariosRepository: Repository<MissaoUsuario>,
  ) {}

  async listarDoUsuario(
    usuarioId: string,
  ): Promise<IResumoConquistaUsuario[]> {
    const conquistas = await this.obterConquistasAtivas();
    const registros = await this.buscarRegistrosUsuario(usuarioId, conquistas);

    return conquistas.map((conquista) => {
      const registro = registros.find(
        (item) => item.conquistaId === conquista.id,
      );

      return {
        conquista: this.mapearConquista(conquista),
        desbloqueada: Boolean(registro),
        conquistadoEm: registro?.conquistadoEm ?? null,
      };
    });
  }

  async avaliarUsuario(usuarioId: string): Promise<IConquistaUsuario[]> {
    const conquistas = await this.obterConquistasAtivas();
    const registros = await this.buscarRegistrosUsuario(usuarioId, conquistas);
    const conquistasJaObtidas = new Set(
      registros.map((registro) => registro.conquistaId),
    );
    const indicadores = await this.calcularIndicadores(usuarioId);
    const desbloqueadas: IConquistaUsuario[] = [];

    for (const conquista of conquistas) {
      if (conquistasJaObtidas.has(conquista.id)) continue;
      if (!this.criterioAtingido(conquista, indicadores)) continue;

      const registro = this.conquistasUsuariosRepository.create({
        conquistaId: conquista.id,
        usuarioId,
        conquistadoEm: new Date(),
      });
      desbloqueadas.push(
        this.mapearConquistaUsuario(
          await this.conquistasUsuariosRepository.save(registro),
        ),
      );
    }

    return desbloqueadas;
  }

  private async obterConquistasAtivas(): Promise<Conquista[]> {
    await this.garantirConquistasPadrao();
    return this.conquistasRepository.find({
      where: { ativa: true },
      order: { valorCriterio: 'ASC', titulo: 'ASC' },
    });
  }

  private async garantirConquistasPadrao(): Promise<void> {
    const existentes = await this.conquistasRepository.find({
      where: { codigo: In(this.conquistasPadrao.map((item) => item.codigo)) },
    });
    const codigosExistentes = new Set(
      existentes.map((conquista) => conquista.codigo),
    );
    const novas = this.conquistasPadrao
      .filter((conquista) => !codigosExistentes.has(conquista.codigo))
      .map((conquista) =>
        this.conquistasRepository.create({
          ...conquista,
          ativa: true,
        }),
      );

    if (novas.length > 0) await this.conquistasRepository.save(novas);
  }

  private async buscarRegistrosUsuario(
    usuarioId: string,
    conquistas: Conquista[],
  ): Promise<ConquistaUsuario[]> {
    if (conquistas.length === 0) return [];

    return this.conquistasUsuariosRepository.find({
      where: {
        usuarioId,
        conquistaId: In(conquistas.map((conquista) => conquista.id)),
      },
    });
  }

  private async calcularIndicadores(
    usuarioId: string,
  ): Promise<IndicadoresConquista> {
    const [licoesConcluidas, progresso, missoesConcluidas] =
      await Promise.all([
        this.conclusoesRepository.count({ where: { usuarioId } }),
        this.progressoRepository.findOneBy({ usuarioId }),
        this.missoesUsuariosRepository.count({
          where: { usuarioId, status: 'concluida' },
        }),
      ]);

    return {
      licoesConcluidas,
      xpTotal: progresso?.xpTotal ?? 0,
      sequenciaDias: progresso?.sequenciaDias ?? 0,
      missoesConcluidas,
    };
  }

  private criterioAtingido(
    conquista: Conquista,
    indicadores: IndicadoresConquista,
  ): boolean {
    const valores: Record<TipoCriterioConquista, number> = {
      licoes_concluidas: indicadores.licoesConcluidas,
      xp_total: indicadores.xpTotal,
      sequencia_dias: indicadores.sequenciaDias,
      missoes_concluidas: indicadores.missoesConcluidas,
    };

    return valores[conquista.tipoCriterio] >= conquista.valorCriterio;
  }

  private mapearConquista(conquista: Conquista): IConquista {
    return {
      id: conquista.id,
      codigo: conquista.codigo,
      titulo: conquista.titulo,
      descricao: conquista.descricao,
      icone: conquista.icone,
      xpRecompensa: conquista.xpRecompensa,
      tipoCriterio: conquista.tipoCriterio,
      valorCriterio: conquista.valorCriterio,
      criterio: conquista.criterio,
      ativa: conquista.ativa,
    };
  }

  private mapearConquistaUsuario(
    conquistaUsuario: ConquistaUsuario,
  ): IConquistaUsuario {
    return {
      id: conquistaUsuario.id,
      conquistaId: conquistaUsuario.conquistaId,
      usuarioId: conquistaUsuario.usuarioId,
      conquistadoEm: conquistaUsuario.conquistadoEm,
    };
  }
}
