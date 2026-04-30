import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ICategoriaTrilha,
  IConquista,
  IConteudoLicaoAdministrativo,
  IDetalheTrilhaAdministrativa,
  ILicaoAdministrativa,
  IMissao,
  IModuloAdministrativo,
  IResumoTrilhaAdministrativa,
  IUsuario,
} from '@tcc/interfaces';
import { Repository } from 'typeorm';
import { Conquista } from '../conquistas/entities/conquista.entity';
import { Missao } from '../missoes/entities/missao.entity';
import { CategoriaTrilha } from '../trilhas/entities/categoria-trilha.entity';
import { ConteudoLicao } from '../trilhas/entities/conteudo-licao.entity';
import { Licao } from '../trilhas/entities/licao.entity';
import { ModuloTrilha } from '../trilhas/entities/modulo-trilha.entity';
import { Trilha } from '../trilhas/entities/trilha.entity';
import { Usuario } from '../usuario/entities/usuario.entity';
import {
  AtualizarCategoriaTrilhaDto,
  AtualizarConquistaDto,
  AtualizarConteudoLicaoDto,
  AtualizarLicaoDto,
  AtualizarMissaoDto,
  AtualizarModuloDto,
  AtualizarTrilhaDto,
  AtualizarUsuarioAdministrativoDto,
  CriarCategoriaTrilhaDto,
  CriarConquistaDto,
  CriarConteudoLicaoDto,
  CriarLicaoDto,
  CriarMissaoDto,
  CriarModuloDto,
  CriarTrilhaDto,
} from './dto/administracao.dto';

@Injectable()
export class AdministracaoService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
    @InjectRepository(CategoriaTrilha)
    private readonly categoriasRepository: Repository<CategoriaTrilha>,
    @InjectRepository(Trilha)
    private readonly trilhasRepository: Repository<Trilha>,
    @InjectRepository(ModuloTrilha)
    private readonly modulosRepository: Repository<ModuloTrilha>,
    @InjectRepository(Licao)
    private readonly licoesRepository: Repository<Licao>,
    @InjectRepository(ConteudoLicao)
    private readonly conteudosRepository: Repository<ConteudoLicao>,
    @InjectRepository(Missao)
    private readonly missoesRepository: Repository<Missao>,
    @InjectRepository(Conquista)
    private readonly conquistasRepository: Repository<Conquista>,
  ) {}

  async listarUsuarios(): Promise<IUsuario[]> {
    const usuarios = await this.usuariosRepository.find({
      order: { nome: 'ASC' },
    });
    return usuarios.map((usuario) => this.mapearUsuario(usuario));
  }

  async atualizarUsuario(
    administradorId: string,
    usuarioId: string,
    dados: AtualizarUsuarioAdministrativoDto,
  ): Promise<IUsuario> {
    const usuario = await this.buscarUsuario(usuarioId);

    if (
      administradorId === usuarioId &&
      (dados.status === 'inativo' || dados.papel === 'estudante')
    ) {
      throw new BadRequestException(
        'Administrador não pode remover o próprio acesso administrativo',
      );
    }

    if (dados.email && dados.email !== usuario.email) {
      const usuarioComEmail = await this.usuariosRepository.findOneBy({
        email: dados.email,
      });
      if (usuarioComEmail) throw new ConflictException('E-mail já cadastrado');
      usuario.email = dados.email;
    }

    if (dados.nome !== undefined) usuario.nome = dados.nome;
    if (dados.papel !== undefined) usuario.papel = dados.papel;
    if (dados.status !== undefined) usuario.status = dados.status;

    return this.mapearUsuario(await this.usuariosRepository.save(usuario));
  }

  async listarCategorias(): Promise<ICategoriaTrilha[]> {
    const categorias = await this.categoriasRepository.find({
      order: { nome: 'ASC' },
    });
    return categorias.map((categoria) => this.mapearCategoria(categoria));
  }

  async criarCategoria(
    dados: CriarCategoriaTrilhaDto,
  ): Promise<ICategoriaTrilha> {
    const categoria = this.categoriasRepository.create({
      nome: dados.nome,
      descricao: dados.descricao ?? null,
    });
    return this.mapearCategoria(await this.categoriasRepository.save(categoria));
  }

  async atualizarCategoria(
    categoriaId: string,
    dados: AtualizarCategoriaTrilhaDto,
  ): Promise<ICategoriaTrilha> {
    const categoria = await this.buscarCategoria(categoriaId);
    if (dados.nome !== undefined) categoria.nome = dados.nome;
    if (dados.descricao !== undefined) categoria.descricao = dados.descricao;
    return this.mapearCategoria(await this.categoriasRepository.save(categoria));
  }

  async listarTrilhas(): Promise<IResumoTrilhaAdministrativa[]> {
    const trilhas = await this.trilhasRepository.find({
      relations: { categoria: true },
      order: { titulo: 'ASC' },
    });
    return trilhas.map((trilha) => this.mapearResumoTrilha(trilha));
  }

  async buscarTrilha(
    trilhaId: string,
  ): Promise<IDetalheTrilhaAdministrativa> {
    const trilha = await this.trilhasRepository.findOne({
      where: { id: trilhaId },
      relations: {
        categoria: true,
        modulos: {
          licoes: {
            conteudos: true,
          },
        },
      },
    });

    if (!trilha) throw new NotFoundException('Trilha não encontrada');
    this.ordenarTrilha(trilha);
    return this.mapearDetalheTrilha(trilha);
  }

  async criarTrilha(dados: CriarTrilhaDto): Promise<IResumoTrilhaAdministrativa> {
    await this.buscarCategoria(dados.categoriaId);
    const trilha = this.trilhasRepository.create({
      titulo: dados.titulo,
      descricao: dados.descricao,
      descricaoResumo: dados.descricaoResumo,
      categoriaId: dados.categoriaId,
      publicada: dados.publicada ?? false,
    });
    const salva = await this.trilhasRepository.save(trilha);
    return this.mapearResumoTrilha(
      await this.buscarTrilhaComCategoria(salva.id),
    );
  }

  async atualizarTrilha(
    trilhaId: string,
    dados: AtualizarTrilhaDto,
  ): Promise<IResumoTrilhaAdministrativa> {
    const trilha = await this.buscarTrilhaComCategoria(trilhaId);
    if (dados.categoriaId !== undefined) {
      await this.buscarCategoria(dados.categoriaId);
      trilha.categoriaId = dados.categoriaId;
    }

    if (dados.titulo !== undefined) trilha.titulo = dados.titulo;
    if (dados.descricao !== undefined) trilha.descricao = dados.descricao;
    if (dados.descricaoResumo !== undefined) {
      trilha.descricaoResumo = dados.descricaoResumo;
    }
    if (dados.publicada !== undefined) trilha.publicada = dados.publicada;

    await this.trilhasRepository.save(trilha);
    return this.mapearResumoTrilha(await this.buscarTrilhaComCategoria(trilhaId));
  }

  async criarModulo(
    trilhaId: string,
    dados: CriarModuloDto,
  ): Promise<IModuloAdministrativo> {
    await this.buscarTrilhaComCategoria(trilhaId);
    const modulo = this.modulosRepository.create({
      trilhaId,
      titulo: dados.titulo,
      ordem: dados.ordem ?? 0,
      publicado: dados.publicado ?? false,
    });
    return this.mapearModulo(await this.modulosRepository.save(modulo));
  }

  async atualizarModulo(
    moduloId: string,
    dados: AtualizarModuloDto,
  ): Promise<IModuloAdministrativo> {
    const modulo = await this.buscarModulo(moduloId);
    if (dados.titulo !== undefined) modulo.titulo = dados.titulo;
    if (dados.ordem !== undefined) modulo.ordem = dados.ordem;
    if (dados.publicado !== undefined) modulo.publicado = dados.publicado;
    return this.mapearModulo(await this.modulosRepository.save(modulo));
  }

  async criarLicao(
    moduloId: string,
    dados: CriarLicaoDto,
  ): Promise<ILicaoAdministrativa> {
    await this.buscarModulo(moduloId);
    const licao = this.licoesRepository.create({
      moduloId,
      titulo: dados.titulo,
      descricao: dados.descricao,
      ordem: dados.ordem ?? 0,
      publicada: dados.publicada ?? false,
    });
    return this.mapearLicao(await this.licoesRepository.save(licao));
  }

  async atualizarLicao(
    licaoId: string,
    dados: AtualizarLicaoDto,
  ): Promise<ILicaoAdministrativa> {
    const licao = await this.buscarLicao(licaoId);
    if (dados.titulo !== undefined) licao.titulo = dados.titulo;
    if (dados.descricao !== undefined) licao.descricao = dados.descricao;
    if (dados.ordem !== undefined) licao.ordem = dados.ordem;
    if (dados.publicada !== undefined) licao.publicada = dados.publicada;
    return this.mapearLicao(await this.licoesRepository.save(licao));
  }

  async criarConteudo(
    licaoId: string,
    dados: CriarConteudoLicaoDto,
  ): Promise<IConteudoLicaoAdministrativo> {
    await this.buscarLicao(licaoId);
    const conteudo = this.conteudosRepository.create({
      licaoId,
      tipo: dados.tipo,
      titulo: dados.titulo ?? null,
      texto: dados.texto ?? null,
      url: dados.url ?? null,
      ordem: dados.ordem ?? 0,
      publicado: dados.publicado ?? false,
    });
    return this.mapearConteudo(await this.conteudosRepository.save(conteudo));
  }

  async atualizarConteudo(
    conteudoId: string,
    dados: AtualizarConteudoLicaoDto,
  ): Promise<IConteudoLicaoAdministrativo> {
    const conteudo = await this.buscarConteudo(conteudoId);
    if (dados.tipo !== undefined) conteudo.tipo = dados.tipo;
    if (dados.titulo !== undefined) conteudo.titulo = dados.titulo;
    if (dados.texto !== undefined) conteudo.texto = dados.texto;
    if (dados.url !== undefined) conteudo.url = dados.url;
    if (dados.ordem !== undefined) conteudo.ordem = dados.ordem;
    if (dados.publicado !== undefined) conteudo.publicado = dados.publicado;
    return this.mapearConteudo(await this.conteudosRepository.save(conteudo));
  }

  async listarMissoes(): Promise<IMissao[]> {
    const missoes = await this.missoesRepository.find({
      order: { tipo: 'ASC', titulo: 'ASC' },
    });
    return missoes.map((missao) => this.mapearMissao(missao));
  }

  async criarMissao(dados: CriarMissaoDto): Promise<IMissao> {
    const missao = this.missoesRepository.create({
      titulo: dados.titulo,
      descricao: dados.descricao,
      tipo: dados.tipo,
      xpRecompensa: dados.xpRecompensa,
      objetivo: dados.objetivo,
      ativa: dados.ativa ?? true,
      inicioEm: this.mapearDataOpcional(dados.inicioEm),
      fimEm: this.mapearDataOpcional(dados.fimEm),
    });
    return this.mapearMissao(await this.missoesRepository.save(missao));
  }

  async atualizarMissao(
    missaoId: string,
    dados: AtualizarMissaoDto,
  ): Promise<IMissao> {
    const missao = await this.buscarMissao(missaoId);
    if (dados.titulo !== undefined) missao.titulo = dados.titulo;
    if (dados.descricao !== undefined) missao.descricao = dados.descricao;
    if (dados.tipo !== undefined) missao.tipo = dados.tipo;
    if (dados.xpRecompensa !== undefined) {
      missao.xpRecompensa = dados.xpRecompensa;
    }
    if (dados.objetivo !== undefined) missao.objetivo = dados.objetivo;
    if (dados.ativa !== undefined) missao.ativa = dados.ativa;
    if (dados.inicioEm !== undefined) {
      missao.inicioEm = this.mapearDataOpcional(dados.inicioEm);
    }
    if (dados.fimEm !== undefined) {
      missao.fimEm = this.mapearDataOpcional(dados.fimEm);
    }
    return this.mapearMissao(await this.missoesRepository.save(missao));
  }

  async listarConquistas(): Promise<IConquista[]> {
    const conquistas = await this.conquistasRepository.find({
      order: { valorCriterio: 'ASC', titulo: 'ASC' },
    });
    return conquistas.map((conquista) => this.mapearConquista(conquista));
  }

  async criarConquista(dados: CriarConquistaDto): Promise<IConquista> {
    await this.garantirCodigoConquistaDisponivel(dados.codigo);
    const conquista = this.conquistasRepository.create({
      codigo: dados.codigo,
      titulo: dados.titulo,
      descricao: dados.descricao,
      icone: dados.icone,
      xpRecompensa: dados.xpRecompensa ?? 0,
      tipoCriterio: dados.tipoCriterio,
      valorCriterio: dados.valorCriterio,
      criterio: dados.criterio,
      ativa: dados.ativa ?? true,
    });
    return this.mapearConquista(await this.conquistasRepository.save(conquista));
  }

  async atualizarConquista(
    conquistaId: string,
    dados: AtualizarConquistaDto,
  ): Promise<IConquista> {
    const conquista = await this.buscarConquista(conquistaId);
    if (dados.codigo && dados.codigo !== conquista.codigo) {
      await this.garantirCodigoConquistaDisponivel(dados.codigo);
      conquista.codigo = dados.codigo;
    }
    if (dados.titulo !== undefined) conquista.titulo = dados.titulo;
    if (dados.descricao !== undefined) conquista.descricao = dados.descricao;
    if (dados.icone !== undefined) conquista.icone = dados.icone;
    if (dados.xpRecompensa !== undefined) {
      conquista.xpRecompensa = dados.xpRecompensa;
    }
    if (dados.tipoCriterio !== undefined) {
      conquista.tipoCriterio = dados.tipoCriterio;
    }
    if (dados.valorCriterio !== undefined) {
      conquista.valorCriterio = dados.valorCriterio;
    }
    if (dados.criterio !== undefined) conquista.criterio = dados.criterio;
    if (dados.ativa !== undefined) conquista.ativa = dados.ativa;
    return this.mapearConquista(await this.conquistasRepository.save(conquista));
  }

  private async buscarUsuario(usuarioId: string): Promise<Usuario> {
    const usuario = await this.usuariosRepository.findOneBy({ id: usuarioId });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario;
  }

  private async buscarCategoria(categoriaId: string): Promise<CategoriaTrilha> {
    const categoria = await this.categoriasRepository.findOneBy({
      id: categoriaId,
    });
    if (!categoria) throw new NotFoundException('Categoria não encontrada');
    return categoria;
  }

  private async buscarTrilhaComCategoria(trilhaId: string): Promise<Trilha> {
    const trilha = await this.trilhasRepository.findOne({
      where: { id: trilhaId },
      relations: { categoria: true },
    });
    if (!trilha) throw new NotFoundException('Trilha não encontrada');
    return trilha;
  }

  private async buscarModulo(moduloId: string): Promise<ModuloTrilha> {
    const modulo = await this.modulosRepository.findOne({
      where: { id: moduloId },
      relations: { licoes: { conteudos: true } },
    });
    if (!modulo) throw new NotFoundException('Módulo não encontrado');
    return modulo;
  }

  private async buscarLicao(licaoId: string): Promise<Licao> {
    const licao = await this.licoesRepository.findOne({
      where: { id: licaoId },
      relations: { conteudos: true },
    });
    if (!licao) throw new NotFoundException('Lição não encontrada');
    return licao;
  }

  private async buscarConteudo(conteudoId: string): Promise<ConteudoLicao> {
    const conteudo = await this.conteudosRepository.findOneBy({
      id: conteudoId,
    });
    if (!conteudo) throw new NotFoundException('Conteúdo não encontrado');
    return conteudo;
  }

  private async buscarMissao(missaoId: string): Promise<Missao> {
    const missao = await this.missoesRepository.findOneBy({ id: missaoId });
    if (!missao) throw new NotFoundException('Missão não encontrada');
    return missao;
  }

  private async buscarConquista(conquistaId: string): Promise<Conquista> {
    const conquista = await this.conquistasRepository.findOneBy({
      id: conquistaId,
    });
    if (!conquista) throw new NotFoundException('Conquista não encontrada');
    return conquista;
  }

  private async garantirCodigoConquistaDisponivel(
    codigo: string,
  ): Promise<void> {
    const existente = await this.conquistasRepository.findOneBy({ codigo });
    if (existente) throw new ConflictException('Código de conquista já existe');
  }

  private mapearUsuario(usuario: Usuario): IUsuario {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      status: usuario.status,
      criadoEm: usuario.criadoEm,
      atualizadoEm: usuario.atualizadoEm,
    };
  }

  private mapearCategoria(categoria: CategoriaTrilha): ICategoriaTrilha {
    return {
      id: categoria.id,
      nome: categoria.nome,
      descricao: categoria.descricao,
    };
  }

  private mapearResumoTrilha(trilha: Trilha): IResumoTrilhaAdministrativa {
    return {
      id: trilha.id,
      titulo: trilha.titulo,
      descricao: trilha.descricao,
      descricaoResumo: trilha.descricaoResumo,
      categoria: this.mapearCategoria(trilha.categoria),
      publicada: trilha.publicada,
      criadoEm: trilha.criadoEm,
      atualizadoEm: trilha.atualizadoEm,
    };
  }

  private mapearDetalheTrilha(trilha: Trilha): IDetalheTrilhaAdministrativa {
    return {
      ...this.mapearResumoTrilha(trilha),
      modulos: (trilha.modulos ?? []).map((modulo) =>
        this.mapearModulo(modulo),
      ),
    };
  }

  private mapearModulo(modulo: ModuloTrilha): IModuloAdministrativo {
    return {
      id: modulo.id,
      titulo: modulo.titulo,
      ordem: modulo.ordem,
      publicado: modulo.publicado,
      licoes: (modulo.licoes ?? []).map((licao) => this.mapearLicao(licao)),
    };
  }

  private mapearLicao(licao: Licao): ILicaoAdministrativa {
    return {
      id: licao.id,
      titulo: licao.titulo,
      descricao: licao.descricao,
      ordem: licao.ordem,
      publicada: licao.publicada,
      conteudos: (licao.conteudos ?? []).map((conteudo) =>
        this.mapearConteudo(conteudo),
      ),
    };
  }

  private mapearConteudo(
    conteudo: ConteudoLicao,
  ): IConteudoLicaoAdministrativo {
    return {
      id: conteudo.id,
      tipo: conteudo.tipo,
      titulo: conteudo.titulo,
      texto: conteudo.texto,
      url: conteudo.url,
      ordem: conteudo.ordem,
      publicado: conteudo.publicado,
    };
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

  private mapearDataOpcional(valor: string | null | undefined): Date | null {
    if (!valor) return null;
    return new Date(valor);
  }

  private ordenarTrilha(trilha: Trilha): void {
    trilha.modulos = (trilha.modulos ?? []).sort(
      (a, b) => a.ordem - b.ordem,
    );
    for (const modulo of trilha.modulos) {
      modulo.licoes = (modulo.licoes ?? []).sort((a, b) => a.ordem - b.ordem);
      for (const licao of modulo.licoes) {
        licao.conteudos = (licao.conteudos ?? []).sort(
          (a, b) => a.ordem - b.ordem,
        );
      }
    }
  }
}
