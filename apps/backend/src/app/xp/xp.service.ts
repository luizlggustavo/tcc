import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IEventoXp, TipoOrigemXp } from '@tcc/interfaces';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { ProgressoUsuario } from '../progresso/entities/progresso-usuario.entity';
import { HistoricoXp } from './entities/historico-xp.entity';

interface DadosConcessaoXp {
  usuarioId: string;
  quantidade: number;
  tipoOrigem: TipoOrigemXp;
  referenciaOrigemId: string;
}

interface FiltrosHistoricoXp {
  inicio?: Date;
  fim?: Date;
}

@Injectable()
export class XpService {
  static readonly XP_POR_CONCLUSAO_LICAO = 10;

  constructor(
    @InjectRepository(ProgressoUsuario)
    private readonly progressoRepository: Repository<ProgressoUsuario>,
    @InjectRepository(HistoricoXp)
    private readonly historicoRepository: Repository<HistoricoXp>,
  ) {}

  calcularNivel(xpTotal: number): number {
    return Math.floor(xpTotal / 100) + 1;
  }

  async concederXp(dados: DadosConcessaoXp): Promise<IEventoXp> {
    if (dados.quantidade <= 0) {
      throw new BadRequestException('Quantidade de XP deve ser positiva');
    }

    const progresso = await this.obterOuCriarProgresso(dados.usuarioId);
    progresso.xpTotal += dados.quantidade;
    progresso.nivel = this.calcularNivel(progresso.xpTotal);

    const progressoSalvo = await this.progressoRepository.save(progresso);
    const evento = this.historicoRepository.create({
      usuarioId: dados.usuarioId,
      quantidade: dados.quantidade,
      tipoOrigem: dados.tipoOrigem,
      referenciaOrigemId: dados.referenciaOrigemId,
      xpTotalAposEvento: progressoSalvo.xpTotal,
      nivelAposEvento: progressoSalvo.nivel,
    });

    return this.mapearEvento(await this.historicoRepository.save(evento));
  }

  async listarHistorico(
    usuarioId: string,
    filtros: FiltrosHistoricoXp,
  ): Promise<IEventoXp[]> {
    const where: FindOptionsWhere<HistoricoXp> = { usuarioId };

    if (filtros.inicio && filtros.fim) {
      where.criadoEm = Between(filtros.inicio, filtros.fim);
    } else if (filtros.inicio) {
      where.criadoEm = MoreThanOrEqual(filtros.inicio);
    } else if (filtros.fim) {
      where.criadoEm = LessThanOrEqual(filtros.fim);
    }

    const eventos = await this.historicoRepository.find({
      where,
      order: { criadoEm: 'DESC' },
      take: 20,
    });

    return eventos.map((evento) => this.mapearEvento(evento));
  }

  private async obterOuCriarProgresso(
    usuarioId: string,
  ): Promise<ProgressoUsuario> {
    const progressoExistente = await this.progressoRepository.findOneBy({
      usuarioId,
    });
    if (progressoExistente) return progressoExistente;

    return this.progressoRepository.create({
      usuarioId,
      xpTotal: 0,
      nivel: 1,
      sequenciaDias: 0,
      ultimoAcessoEm: null,
    });
  }

  private mapearEvento(evento: HistoricoXp): IEventoXp {
    return {
      id: evento.id,
      usuarioId: evento.usuarioId,
      quantidade: evento.quantidade,
      tipoOrigem: evento.tipoOrigem,
      referenciaOrigemId: evento.referenciaOrigemId,
      xpTotalAposEvento: evento.xpTotalAposEvento,
      nivelAposEvento: evento.nivelAposEvento,
      criadoEm: evento.criadoEm,
    };
  }
}
