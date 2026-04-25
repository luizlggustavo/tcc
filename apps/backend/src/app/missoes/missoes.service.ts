import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IMissao,
  IMissaoUsuario,
  IResultadoConclusaoMissao,
  IResumoMissaoUsuario,
  StatusMissao,
} from '@tcc/interfaces';
import { In, Repository } from 'typeorm';
import { ConquistasService } from '../conquistas/conquistas.service';
import { XpService } from '../xp/xp.service';
import { MissaoUsuario } from './entities/missao-usuario.entity';
import { Missao } from './entities/missao.entity';

interface FiltrosListagemMissoes {
  status?: StatusMissao;
}

@Injectable()
export class MissoesService {
  constructor(
    @InjectRepository(Missao)
    private readonly missoesRepository: Repository<Missao>,
    @InjectRepository(MissaoUsuario)
    private readonly missoesUsuariosRepository: Repository<MissaoUsuario>,
    private readonly xpService: XpService,
    private readonly conquistasService: ConquistasService,
  ) {}

  async listar(
    usuarioId: string,
    filtros: FiltrosListagemMissoes = {},
  ): Promise<IResumoMissaoUsuario[]> {
    const agora = new Date();
    const missoes = await this.missoesRepository.find({
      where: { ativa: true },
      order: { tipo: 'ASC', titulo: 'ASC' },
    });
    const registros = await this.buscarRegistrosDoUsuario(usuarioId, missoes);

    return missoes
      .map((missao) => this.mapearResumo(usuarioId, missao, registros, agora))
      .filter((resumo): resumo is IResumoMissaoUsuario => Boolean(resumo))
      .filter((resumo) =>
        filtros.status ? resumo.status === filtros.status : true,
      );
  }

  async iniciar(usuarioId: string, missaoId: string): Promise<IMissaoUsuario> {
    const agora = new Date();
    const missao = await this.buscarMissaoAtiva(missaoId);
    this.validarDisponibilidade(missao, agora);

    const cicloReferencia = this.calcularCicloReferencia(missao, agora);
    const registro = await this.buscarRegistro(
      usuarioId,
      missao.id,
      cicloReferencia,
    );

    if (registro?.status === 'concluida') {
      throw new BadRequestException(
        'Missão concluída não pode ser iniciada novamente neste ciclo',
      );
    }

    if (registro?.status === 'em_andamento') {
      return this.mapearMissaoUsuario(registro);
    }

    const missaoUsuario =
      registro ??
      this.missoesUsuariosRepository.create({
        usuarioId,
        missaoId: missao.id,
        cicloReferencia,
      });

    missaoUsuario.status = 'em_andamento';
    missaoUsuario.iniciadoEm = missaoUsuario.iniciadoEm ?? agora;
    missaoUsuario.concluidoEm = null;

    return this.mapearMissaoUsuario(
      await this.missoesUsuariosRepository.save(missaoUsuario),
    );
  }

  async concluir(
    usuarioId: string,
    missaoId: string,
  ): Promise<IResultadoConclusaoMissao> {
    const agora = new Date();
    const missao = await this.buscarMissaoAtiva(missaoId);
    const cicloReferencia = this.calcularCicloReferencia(missao, agora);
    const registro = await this.buscarRegistro(
      usuarioId,
      missao.id,
      cicloReferencia,
    );

    if (registro?.status === 'concluida') {
      return {
        missaoUsuario: this.mapearMissaoUsuario(registro),
        eventoXp: null,
        conquistasDesbloqueadas: [],
      };
    }

    this.validarDisponibilidade(missao, agora);

    if (!registro || registro.status !== 'em_andamento') {
      throw new BadRequestException(
        'Missão deve ser iniciada antes da conclusão',
      );
    }

    registro.status = 'concluida';
    registro.concluidoEm = agora;

    const missaoUsuarioSalva =
      await this.missoesUsuariosRepository.save(registro);
    const eventoXp = await this.xpService.concederXp({
      usuarioId,
      quantidade: missao.xpRecompensa,
      tipoOrigem: 'conclusao_missao',
      referenciaOrigemId: missaoUsuarioSalva.id,
    });
    const conquistasDesbloqueadas =
      await this.conquistasService.avaliarUsuario(usuarioId);

    return {
      missaoUsuario: this.mapearMissaoUsuario(missaoUsuarioSalva),
      eventoXp,
      conquistasDesbloqueadas,
    };
  }

  private async buscarRegistrosDoUsuario(
    usuarioId: string,
    missoes: Missao[],
  ): Promise<MissaoUsuario[]> {
    if (missoes.length === 0) return [];

    return this.missoesUsuariosRepository.find({
      where: {
        usuarioId,
        missaoId: In(missoes.map((missao) => missao.id)),
      },
    });
  }

  private async buscarMissaoAtiva(missaoId: string): Promise<Missao> {
    const missao = await this.missoesRepository.findOne({
      where: { id: missaoId, ativa: true },
    });

    if (!missao) throw new NotFoundException('Missão não encontrada');
    return missao;
  }

  private buscarRegistro(
    usuarioId: string,
    missaoId: string,
    cicloReferencia: string,
  ): Promise<MissaoUsuario | null> {
    return this.missoesUsuariosRepository.findOne({
      where: { usuarioId, missaoId, cicloReferencia },
    });
  }

  private mapearResumo(
    usuarioId: string,
    missao: Missao,
    registros: MissaoUsuario[],
    agora: Date,
  ): IResumoMissaoUsuario | null {
    if (this.missaoAindaNaoIniciou(missao, agora)) return null;

    const cicloReferencia = this.calcularCicloReferencia(missao, agora);
    const registro = registros.find(
      (item) =>
        item.usuarioId === usuarioId &&
        item.missaoId === missao.id &&
        item.cicloReferencia === cicloReferencia,
    );

    if (registro) {
      const status =
        registro.status === 'concluida' || !this.missaoExpirou(missao, agora)
          ? registro.status
          : 'expirada';

      return {
        missao: this.mapearMissao(missao),
        status,
        cicloReferencia,
        iniciadoEm: registro.iniciadoEm,
        concluidoEm: registro.concluidoEm,
      };
    }

    if (this.missaoExpirou(missao, agora)) return null;

    return {
      missao: this.mapearMissao(missao),
      status: 'disponivel',
      cicloReferencia,
      iniciadoEm: null,
      concluidoEm: null,
    };
  }

  private validarDisponibilidade(missao: Missao, agora: Date): void {
    if (this.missaoAindaNaoIniciou(missao, agora)) {
      throw new BadRequestException('Missão ainda não está disponível');
    }

    if (this.missaoExpirou(missao, agora)) {
      throw new BadRequestException('Missão expirada não pode ser concluída');
    }
  }

  private missaoAindaNaoIniciou(missao: Missao, agora: Date): boolean {
    return Boolean(
      missao.inicioEm && missao.inicioEm.getTime() > agora.getTime(),
    );
  }

  private missaoExpirou(missao: Missao, agora: Date): boolean {
    return Boolean(missao.fimEm && missao.fimEm.getTime() < agora.getTime());
  }

  private calcularCicloReferencia(missao: Missao, data: Date): string {
    if (missao.tipo === 'unica') return 'unica';
    if (missao.tipo === 'semanal') return this.formatarSemanaIso(data);
    return this.formatarData(data);
  }

  private formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private formatarSemanaIso(data: Date): string {
    const dataUtc = new Date(
      Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()),
    );
    const diaSemana = dataUtc.getUTCDay() || 7;
    dataUtc.setUTCDate(dataUtc.getUTCDate() + 4 - diaSemana);

    const ano = dataUtc.getUTCFullYear();
    const inicioAno = new Date(Date.UTC(ano, 0, 1));
    const semana = Math.ceil(
      ((dataUtc.getTime() - inicioAno.getTime()) / 86400000 + 1) / 7,
    );

    return `${ano}-W${String(semana).padStart(2, '0')}`;
  }

  private mapearMissao(missao: Missao): IMissao {
    return {
      id: missao.id,
      titulo: missao.titulo,
      descricao: missao.descricao,
      tipo: missao.tipo,
      xpRecompensa: missao.xpRecompensa,
      objetivo: missao.objetivo,
      ativa: missao.ativa,
      inicioEm: missao.inicioEm,
      fimEm: missao.fimEm,
      criadoEm: missao.criadoEm,
    };
  }

  private mapearMissaoUsuario(missaoUsuario: MissaoUsuario): IMissaoUsuario {
    return {
      id: missaoUsuario.id,
      missaoId: missaoUsuario.missaoId,
      usuarioId: missaoUsuario.usuarioId,
      status: missaoUsuario.status,
      cicloReferencia: missaoUsuario.cicloReferencia,
      iniciadoEm: missaoUsuario.iniciadoEm,
      concluidoEm: missaoUsuario.concluidoEm,
    };
  }
}
