import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IProgressoTrilha,
  IRegistroTempoEstudo,
  IResultadoConclusaoLicao,
  IResumoProgresso,
} from '@tcc/interfaces';
import { DataSource, Repository } from 'typeorm';
import { ConquistasService } from '../conquistas/conquistas.service';
import { Licao } from '../trilhas/entities/licao.entity';
import { XpService } from '../xp/xp.service';
import { ConclusaoLicao } from './entities/conclusao-licao.entity';
import { ProgressoUsuario } from './entities/progresso-usuario.entity';
import { SessaoEstudo } from './entities/sessao-estudo.entity';

@Injectable()
export class ProgressoService {
  private readonly formatadorDiaSequencia = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
  });

  constructor(
    @InjectRepository(ProgressoUsuario)
    private readonly progressoRepository: Repository<ProgressoUsuario>,
    @InjectRepository(ConclusaoLicao)
    private readonly conclusoesRepository: Repository<ConclusaoLicao>,
    @InjectRepository(SessaoEstudo)
    private readonly sessoesRepository: Repository<SessaoEstudo>,
    @InjectRepository(Licao)
    private readonly licoesRepository: Repository<Licao>,
    private readonly dataSource: DataSource,
    private readonly xpService: XpService,
    private readonly conquistasService: ConquistasService,
  ) {}

  async obterOuCriarInicial(usuarioId: string): Promise<IResumoProgresso> {
    const progressoExistente = await this.progressoRepository.findOneBy({
      usuarioId,
    });

    if (progressoExistente) return this.mapearResumoAtivo(progressoExistente);

    const progresso = this.progressoRepository.create({
      usuarioId,
      xpTotal: 0,
      nivel: 1,
      sequenciaDias: 0,
      ultimoAcessoEm: null,
    });

    const salvo = await this.progressoRepository.save(progresso);
    return this.mapearResumoAtivo(salvo);
  }

  async concluirLicao(
    usuarioId: string,
    trilhaId: string,
    licaoId: string,
    tempoEstudoSegundos: number,
  ): Promise<IResultadoConclusaoLicao> {
    await this.buscarLicaoPublicadaDaTrilha(trilhaId, licaoId);

    const conclusaoExistente = await this.conclusoesRepository.findOne({
      where: { usuarioId, licaoId },
    });

    if (conclusaoExistente) {
      return this.mapearResultadoConclusao(
        conclusaoExistente,
        await this.buscarSessaoDaConclusao(usuarioId, trilhaId, licaoId),
        await this.calcularProgressoTrilha(usuarioId, trilhaId),
        await this.obterOuCriarInicial(usuarioId),
        null,
        [],
      );
    }

    const concluidaEm = new Date();
    const conclusao = this.conclusoesRepository.create({
      usuarioId,
      trilhaId,
      licaoId,
      concluidaEm,
    });
    const conclusaoSalva = await this.conclusoesRepository.save(conclusao);
    const sessaoSalva = await this.registrarSessaoEstudo(
      usuarioId,
      trilhaId,
      licaoId,
      tempoEstudoSegundos,
      concluidaEm,
    );
    const eventoXp = await this.xpService.concederXp({
      usuarioId,
      quantidade: XpService.XP_POR_CONCLUSAO_LICAO,
      tipoOrigem: 'conclusao_licao',
      referenciaOrigemId: licaoId,
    });
    const progressoUsuario = await this.atualizarSequenciaEstudos(
      usuarioId,
      concluidaEm,
    );
    const conquistasDesbloqueadas =
      await this.conquistasService.avaliarUsuario(usuarioId);

    return this.mapearResultadoConclusao(
      conclusaoSalva,
      sessaoSalva,
      await this.calcularProgressoTrilha(usuarioId, trilhaId),
      progressoUsuario,
      eventoXp,
      conquistasDesbloqueadas,
    );
  }

  async calcularProgressoTrilha(
    usuarioId: string,
    trilhaId: string,
  ): Promise<IProgressoTrilha> {
    const totalLicoes = await this.licoesRepository
      .createQueryBuilder('licao')
      .innerJoin(
        'licao.modulo',
        'modulo',
        'modulo.publicado = :moduloPublicado',
        { moduloPublicado: true },
      )
      .innerJoin(
        'modulo.trilha',
        'trilha',
        'trilha.id = :trilhaId AND trilha.publicada = :trilhaPublicada',
        { trilhaId, trilhaPublicada: true },
      )
      .where('licao.publicada = :licaoPublicada', { licaoPublicada: true })
      .getCount();

    const licoesConcluidas = await this.conclusoesRepository
      .createQueryBuilder('conclusao')
      .innerJoin(
        'conclusao.licao',
        'licao',
        'licao.publicada = :licaoPublicada',
        { licaoPublicada: true },
      )
      .innerJoin(
        'licao.modulo',
        'modulo',
        'modulo.publicado = :moduloPublicado',
        { moduloPublicado: true },
      )
      .innerJoin(
        'modulo.trilha',
        'trilha',
        'trilha.id = :trilhaId AND trilha.publicada = :trilhaPublicada',
        { trilhaId, trilhaPublicada: true },
      )
      .where('conclusao.usuarioId = :usuarioId', { usuarioId })
      .andWhere('conclusao.trilhaId = :trilhaId', { trilhaId })
      .getCount();

    return {
      trilhaId,
      totalLicoes,
      licoesConcluidas,
      percentualConclusao:
        totalLicoes === 0
          ? 0
          : Math.round((licoesConcluidas / totalLicoes) * 100),
    };
  }

  async listarLicoesConcluidas(
    usuarioId: string,
    licaoIds: string[],
  ): Promise<Set<string>> {
    if (licaoIds.length === 0) return new Set<string>();

    const conclusoes = await this.conclusoesRepository
      .createQueryBuilder('conclusao')
      .select('conclusao.licaoId', 'licaoId')
      .where('conclusao.usuarioId = :usuarioId', { usuarioId })
      .andWhere('conclusao.licaoId IN (:...licaoIds)', { licaoIds })
      .getRawMany<{ licaoId: string }>();

    return new Set(conclusoes.map((conclusao) => conclusao.licaoId));
  }

  async licaoEstaConcluida(
    usuarioId: string,
    licaoId: string,
  ): Promise<boolean> {
    const quantidade = await this.conclusoesRepository.count({
      where: { usuarioId, licaoId },
    });
    return quantidade > 0;
  }

  private mapearResumoAtivo(
    progresso: ProgressoUsuario,
    referencia = new Date(),
  ): IResumoProgresso {
    return {
      xpTotal: progresso.xpTotal,
      nivel: progresso.nivel,
      sequenciaDias: this.obterSequenciaAtiva(progresso, referencia),
    };
  }

  private obterSequenciaAtiva(
    progresso: ProgressoUsuario,
    referencia: Date,
  ): number {
    if (!progresso.ultimoAcessoEm) return 0;

    const diferenca = this.calcularDiferencaDias(
      progresso.ultimoAcessoEm,
      referencia,
    );

    return diferenca <= 1 ? progresso.sequenciaDias : 0;
  }

  private async atualizarSequenciaEstudos(
    usuarioId: string,
    estudadoEm: Date,
  ): Promise<IResumoProgresso> {
    return this.dataSource.transaction(async (gerenciador) => {
      const progressoRepository =
        gerenciador.getRepository(ProgressoUsuario);
      let progresso = await progressoRepository.findOne({
        where: { usuarioId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!progresso) {
        progresso = progressoRepository.create({
          usuarioId,
          xpTotal: 0,
          nivel: 1,
          sequenciaDias: 0,
          ultimoAcessoEm: null,
        });
      }

      const diferenca = progresso.ultimoAcessoEm
        ? this.calcularDiferencaDias(progresso.ultimoAcessoEm, estudadoEm)
        : null;

      if (diferenca === 0) {
        progresso.ultimoAcessoEm = estudadoEm;
      } else {
        progresso.sequenciaDias =
          diferenca === 1 ? progresso.sequenciaDias + 1 : 1;
        progresso.ultimoAcessoEm = estudadoEm;
      }

      const progressoSalvo = await progressoRepository.save(progresso);
      return this.mapearResumoAtivo(progressoSalvo, estudadoEm);
    });
  }

  private calcularDiferencaDias(inicio: Date, fim: Date): number {
    const diaInicio = this.converterChaveDiaParaUtc(
      this.obterChaveDiaSequencia(inicio),
    );
    const diaFim = this.converterChaveDiaParaUtc(
      this.obterChaveDiaSequencia(fim),
    );

    return Math.floor((diaFim.getTime() - diaInicio.getTime()) / 86400000);
  }

  private obterChaveDiaSequencia(data: Date): string {
    const partes = this.formatadorDiaSequencia.formatToParts(data);
    const valores = Object.fromEntries(
      partes
        .filter((parte) => parte.type !== 'literal')
        .map((parte) => [parte.type, parte.value]),
    );

    return `${valores['year']}-${valores['month']}-${valores['day']}`;
  }

  private converterChaveDiaParaUtc(chave: string): Date {
    const [ano, mes, dia] = chave.split('-').map(Number);
    return new Date(Date.UTC(ano, mes - 1, dia));
  }

  private async buscarLicaoPublicadaDaTrilha(
    trilhaId: string,
    licaoId: string,
  ): Promise<Licao> {
    const licao = await this.licoesRepository
      .createQueryBuilder('licao')
      .innerJoinAndSelect(
        'licao.modulo',
        'modulo',
        'modulo.publicado = :moduloPublicado',
        { moduloPublicado: true },
      )
      .innerJoinAndSelect(
        'modulo.trilha',
        'trilha',
        'trilha.id = :trilhaId AND trilha.publicada = :trilhaPublicada',
        { trilhaId, trilhaPublicada: true },
      )
      .where('licao.id = :licaoId', { licaoId })
      .andWhere('licao.publicada = :licaoPublicada', {
        licaoPublicada: true,
      })
      .getOne();

    if (!licao) throw new NotFoundException('Lição não encontrada');
    return licao;
  }

  private async registrarSessaoEstudo(
    usuarioId: string,
    trilhaId: string,
    licaoId: string,
    duracaoSegundos: number,
    fimEm: Date,
  ): Promise<SessaoEstudo> {
    const inicioEm = new Date(fimEm.getTime() - duracaoSegundos * 1000);
    const sessao = this.sessoesRepository.create({
      usuarioId,
      trilhaId,
      licaoId,
      inicioEm,
      fimEm,
      duracaoSegundos,
    });

    return this.sessoesRepository.save(sessao);
  }

  private buscarSessaoDaConclusao(
    usuarioId: string,
    trilhaId: string,
    licaoId: string,
  ): Promise<SessaoEstudo | null> {
    return this.sessoesRepository.findOne({
      where: { usuarioId, trilhaId, licaoId },
      order: { inicioEm: 'ASC' },
    });
  }

  private mapearResultadoConclusao(
    conclusao: ConclusaoLicao,
    sessao: SessaoEstudo | null,
    progressoTrilha: IProgressoTrilha,
    progressoUsuario: IResumoProgresso,
    eventoXp: IResultadoConclusaoLicao['eventoXp'],
    conquistasDesbloqueadas: IResultadoConclusaoLicao['conquistasDesbloqueadas'],
  ): IResultadoConclusaoLicao {
    return {
      licaoId: conclusao.licaoId,
      concluida: true,
      concluidaEm: conclusao.concluidaEm,
      progressoTrilha,
      progressoUsuario,
      tempoEstudo: sessao ? this.mapearTempoEstudo(sessao) : null,
      eventoXp,
      conquistasDesbloqueadas,
    };
  }

  private mapearTempoEstudo(sessao: SessaoEstudo): IRegistroTempoEstudo {
    return {
      usuarioId: sessao.usuarioId,
      trilhaId: sessao.trilhaId,
      licaoId: sessao.licaoId,
      inicioEm: sessao.inicioEm,
      fimEm: sessao.fimEm,
      duracaoSegundos: sessao.duracaoSegundos,
    };
  }
}
