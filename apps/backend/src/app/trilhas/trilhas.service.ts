import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IConteudoLicao,
  IDetalheLicao,
  IDetalheTrilha,
  IResumoLicao,
  IResumoModulo,
  IResumoTrilha,
} from '@tcc/interfaces';
import { Repository } from 'typeorm';
import { CategoriaTrilha } from './entities/categoria-trilha.entity';
import { ConteudoLicao } from './entities/conteudo-licao.entity';
import { Licao } from './entities/licao.entity';
import { ModuloTrilha } from './entities/modulo-trilha.entity';
import { Trilha } from './entities/trilha.entity';
import { ProgressoService } from '../progresso/progresso.service';

@Injectable()
export class TrilhasService {
  constructor(
    @InjectRepository(Trilha)
    private readonly trilhasRepository: Repository<Trilha>,
    @InjectRepository(Licao)
    private readonly licoesRepository: Repository<Licao>,
    private readonly progressoService: ProgressoService,
  ) {}

  async listarPublicadas(): Promise<IResumoTrilha[]> {
    const trilhas = await this.trilhasRepository.find({
      where: { publicada: true },
      relations: { categoria: true },
      order: { titulo: 'ASC' },
    });

    return trilhas.map((trilha) => this.mapearResumoTrilha(trilha));
  }

  async buscarDetalhePublico(
    usuarioId: string,
    trilhaId: string,
  ): Promise<IDetalheTrilha> {
    const trilha = await this.trilhasRepository
      .createQueryBuilder('trilha')
      .leftJoinAndSelect('trilha.categoria', 'categoria')
      .leftJoinAndSelect(
        'trilha.modulos',
        'modulo',
        'modulo.publicado = :publicado',
        { publicado: true },
      )
      .leftJoinAndSelect(
        'modulo.licoes',
        'licao',
        'licao.publicada = :publicada',
        { publicada: true },
      )
      .where('trilha.id = :trilhaId', { trilhaId })
      .andWhere('trilha.publicada = :trilhaPublicada', {
        trilhaPublicada: true,
      })
      .orderBy('modulo.ordem', 'ASC')
      .addOrderBy('licao.ordem', 'ASC')
      .getOne();

    if (!trilha) throw new NotFoundException('Trilha não encontrada');

    const licaoIds = this.extrairLicaoIds(trilha.modulos ?? []);
    const licoesConcluidas = await this.progressoService.listarLicoesConcluidas(
      usuarioId,
      licaoIds,
    );

    return {
      ...this.mapearResumoTrilha(trilha),
      descricao: trilha.descricao,
      progresso: await this.progressoService.calcularProgressoTrilha(
        usuarioId,
        trilhaId,
      ),
      modulos: this.mapearModulos(trilha.modulos ?? [], licoesConcluidas),
    };
  }

  async buscarLicaoPublica(
    usuarioId: string,
    trilhaId: string,
    licaoId: string,
  ): Promise<IDetalheLicao> {
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
      .leftJoinAndSelect(
        'licao.conteudos',
        'conteudo',
        'conteudo.publicado = :conteudoPublicado',
        { conteudoPublicado: true },
      )
      .where('licao.id = :licaoId', { licaoId })
      .andWhere('licao.publicada = :licaoPublicada', {
        licaoPublicada: true,
      })
      .orderBy('conteudo.ordem', 'ASC')
      .getOne();

    if (!licao) throw new NotFoundException('Lição não encontrada');

    return {
      ...this.mapearResumoLicao(
        licao,
        await this.progressoService.licaoEstaConcluida(usuarioId, licao.id),
      ),
      trilha: {
        id: licao.modulo.trilha.id,
        titulo: licao.modulo.trilha.titulo,
      },
      modulo: {
        id: licao.modulo.id,
        titulo: licao.modulo.titulo,
      },
      conteudos: (licao.conteudos ?? []).map((conteudo) =>
        this.mapearConteudo(conteudo),
      ),
    };
  }

  private mapearResumoTrilha(trilha: Trilha): IResumoTrilha {
    return {
      id: trilha.id,
      titulo: trilha.titulo,
      descricaoResumo: trilha.descricaoResumo,
      categoria: this.mapearCategoria(trilha.categoria),
    };
  }

  private mapearCategoria(categoria: CategoriaTrilha) {
    return {
      id: categoria.id,
      nome: categoria.nome,
      descricao: categoria.descricao,
    };
  }

  private mapearModulos(
    modulos: ModuloTrilha[],
    licoesConcluidas: Set<string>,
  ): IResumoModulo[] {
    return modulos.map((modulo) => ({
      id: modulo.id,
      titulo: modulo.titulo,
      ordem: modulo.ordem,
      licoes: (modulo.licoes ?? []).map((licao) =>
        this.mapearResumoLicao(licao, licoesConcluidas.has(licao.id)),
      ),
    }));
  }

  private mapearResumoLicao(
    licao: Licao,
    concluida = false,
  ): IResumoLicao {
    return {
      id: licao.id,
      titulo: licao.titulo,
      descricao: licao.descricao,
      ordem: licao.ordem,
      concluida,
    };
  }

  private extrairLicaoIds(modulos: ModuloTrilha[]): string[] {
    return modulos.flatMap((modulo) =>
      (modulo.licoes ?? []).map((licao) => licao.id),
    );
  }

  private mapearConteudo(conteudo: ConteudoLicao): IConteudoLicao {
    return {
      id: conteudo.id,
      tipo: conteudo.tipo,
      titulo: conteudo.titulo,
      texto: conteudo.texto,
      url: conteudo.url,
      ordem: conteudo.ordem,
    };
  }
}
