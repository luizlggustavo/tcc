import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AgrupamentoEstatisticas,
  ICategoriaTrilha,
  IConquista,
  IConteudoLicaoAdministrativo,
  ICriarConquista,
  ICriarConteudoLicao,
  ICriarLicao,
  ICriarMissao,
  ICriarModulo,
  ICriarTrilha,
  IDetalheTrilhaAdministrativa,
  ILicaoAdministrativa,
  IMissao,
  IModuloAdministrativo,
  IResumoTrilhaAdministrativa,
  IUsuario,
  ILinhaEstatisticaAgregada,
  MetricaEstatistica,
  PapelUsuario,
  StatusUsuario,
  TipoConteudoLicao,
  TipoCriterioConquista,
  TipoMissao,
} from '@tcc/interfaces';
import { Observable, forkJoin } from 'rxjs';
import { AdministracaoService } from '../../core/services/administracao.service';
import { EstatisticasService } from '../../core/services/estatisticas.service';

interface FormularioEstatisticas {
  inicio: string;
  fim: string;
  agrupamento: AgrupamentoEstatisticas;
}

interface FiltrosEstatisticasConsulta {
  inicio: Date;
  fim: Date;
  agrupamento: AgrupamentoEstatisticas;
}

interface OpcaoAgrupamentoEstatisticas {
  valor: AgrupamentoEstatisticas;
  rotulo: string;
}

@Component({
  standalone: true,
  selector: 'app-painel-administrativo',
  imports: [FormsModule],
  templateUrl: './painel-administrativo.component.html',
  styleUrl: './painel-administrativo.component.scss',
})
export class PainelAdministrativoComponent implements OnInit {
  private readonly administracaoService = inject(AdministracaoService);
  private readonly estatisticasService = inject(EstatisticasService);

  protected readonly usuarios = signal<IUsuario[]>([]);
  protected readonly categorias = signal<ICategoriaTrilha[]>([]);
  protected readonly trilhas = signal<IResumoTrilhaAdministrativa[]>([]);
  protected readonly trilhaSelecionada =
    signal<IDetalheTrilhaAdministrativa | null>(null);
  protected readonly missoes = signal<IMissao[]>([]);
  protected readonly conquistas = signal<IConquista[]>([]);
  protected readonly estatisticas = signal<ILinhaEstatisticaAgregada[]>([]);
  protected readonly carregando = signal(true);
  protected readonly carregandoEstatisticas = signal(false);
  protected readonly exportandoEstatisticas = signal(false);
  protected readonly estatisticasConsultadas = signal(false);
  protected readonly salvando = signal<string | null>(null);
  protected readonly erro = signal<string | null>(null);
  protected readonly sucesso = signal<string | null>(null);

  protected readonly papeis: PapelUsuario[] = ['estudante', 'administrador'];
  protected readonly statusUsuarios: StatusUsuario[] = ['ativo', 'inativo'];
  protected readonly tiposConteudo: TipoConteudoLicao[] = [
    'texto',
    'video',
    'pdf',
    'link',
  ];
  protected readonly tiposMissao: TipoMissao[] = ['diaria', 'semanal', 'unica'];
  protected readonly tiposCriterioConquista: TipoCriterioConquista[] = [
    'licoes_concluidas',
    'xp_total',
    'sequencia_dias',
    'missoes_concluidas',
  ];
  protected readonly agrupamentosEstatisticas: OpcaoAgrupamentoEstatisticas[] =
    [
      { valor: 'dia', rotulo: 'Dia' },
      { valor: 'semana', rotulo: 'Semana' },
      { valor: 'mes', rotulo: 'Mês' },
    ];
  protected readonly rotulosMetricas: Record<MetricaEstatistica, string> = {
    acessos: 'Acessos',
    usuarios_ativos: 'Usuários ativos',
    tempo_estudado_segundos: 'Tempo estudado (s)',
    licoes_concluidas: 'Lições concluídas',
    xp_obtido: 'XP obtido',
    missoes_concluidas: 'Missões concluídas',
    sequencia_media_atual: 'Sequência média atual',
  };

  protected novaCategoria = this.criarFormularioCategoria();
  protected novaTrilha = this.criarFormularioTrilha();
  protected novoModulo = this.criarFormularioModulo();
  protected novaLicao = this.criarFormularioLicao();
  protected novoConteudo = this.criarFormularioConteudo();
  protected novaMissao = this.criarFormularioMissao();
  protected novaConquista = this.criarFormularioConquista();
  protected filtrosEstatisticas = this.criarFormularioEstatisticas();

  ngOnInit(): void {
    this.carregarPainel();
  }

  protected carregarPainel(): void {
    this.carregando.set(true);
    this.erro.set(null);

    forkJoin({
      usuarios: this.administracaoService.listarUsuarios(),
      categorias: this.administracaoService.listarCategorias(),
      trilhas: this.administracaoService.listarTrilhas(),
      missoes: this.administracaoService.listarMissoes(),
      conquistas: this.administracaoService.listarConquistas(),
    }).subscribe({
      next: ({ usuarios, categorias, trilhas, missoes, conquistas }) => {
        this.usuarios.set(usuarios);
        this.categorias.set(categorias);
        this.trilhas.set(trilhas);
        this.missoes.set(missoes);
        this.conquistas.set(conquistas);
        this.garantirCategoriaPadrao();
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar o painel administrativo.');
        this.carregando.set(false);
      },
    });
  }

  protected consultarEstatisticas(): void {
    const filtros = this.converterFiltrosEstatisticas();

    if (!filtros) {
      this.erro.set('Informe um período válido para consultar as métricas.');
      return;
    }

    this.carregandoEstatisticas.set(true);
    this.erro.set(null);
    this.sucesso.set(null);

    this.estatisticasService.consultarAgregado(filtros).subscribe({
      next: (linhas) => {
        this.estatisticas.set(linhas);
        this.estatisticasConsultadas.set(true);
        this.carregandoEstatisticas.set(false);
      },
      error: (erro) => {
        this.estatisticas.set([]);
        this.estatisticasConsultadas.set(true);
        this.erro.set(
          this.extrairMensagemErro(
            erro,
            'Não foi possível consultar as métricas acadêmicas.',
          ),
        );
        this.carregandoEstatisticas.set(false);
      },
    });
  }

  protected exportarEstatisticas(): void {
    const filtros = this.converterFiltrosEstatisticas();

    if (!filtros) {
      this.erro.set('Informe um período válido para exportar as métricas.');
      return;
    }

    this.exportandoEstatisticas.set(true);
    this.erro.set(null);
    this.sucesso.set(null);

    this.estatisticasService.exportarCsv(filtros).subscribe({
      next: (arquivo) => {
        this.baixarArquivoCsv(arquivo);
        this.sinalizarSucesso('Exportação de estatísticas gerada.');
        this.exportandoEstatisticas.set(false);
      },
      error: (erro) => {
        this.erro.set(
          this.extrairMensagemErro(
            erro,
            'Não foi possível exportar as métricas acadêmicas.',
          ),
        );
        this.exportandoEstatisticas.set(false);
      },
    });
  }

  protected formatarPeriodoEstatistica(
    linha: ILinhaEstatisticaAgregada,
  ): string {
    const inicio = new Date(linha.periodoInicio);
    const fim = new Date(linha.periodoFim);
    const fimInclusivo = new Date(fim);
    fimInclusivo.setUTCDate(fimInclusivo.getUTCDate() - 1);

    if (
      inicio.toISOString().slice(0, 10) ===
      fimInclusivo.toISOString().slice(0, 10)
    ) {
      return this.formatarDataBrasileira(inicio);
    }

    return `${this.formatarDataBrasileira(inicio)} a ${this.formatarDataBrasileira(
      fimInclusivo,
    )}`;
  }

  protected formatarValorEstatistica(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 2,
    }).format(valor);
  }

  protected salvarUsuario(usuario: IUsuario): void {
    this.executar(`usuario-${usuario.id}`, () =>
      this.administracaoService.atualizarUsuario(usuario.id, {
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        status: usuario.status,
      }),
    ).subscribe({
      next: (atualizado) => {
        this.usuarios.update((usuarios) =>
          usuarios.map((usuarioAtual) =>
            usuarioAtual.id === atualizado.id ? atualizado : usuarioAtual,
          ),
        );
        this.sinalizarSucesso('Usuário atualizado.');
      },
      error: (erro) =>
        this.sinalizarErro(erro, 'Não foi possível salvar o usuário.'),
    });
  }

  protected criarCategoria(): void {
    if (!this.novaCategoria.nome.trim()) return;

    this.executar('categoria-nova', () =>
      this.administracaoService.criarCategoria(this.novaCategoria),
    ).subscribe({
      next: (categoria) => {
        this.categorias.update((categorias) => [...categorias, categoria]);
        this.novaCategoria = this.criarFormularioCategoria();
        this.garantirCategoriaPadrao();
        this.sinalizarSucesso('Categoria criada.');
      },
      error: (erro) =>
        this.sinalizarErro(erro, 'Não foi possível criar a categoria.'),
    });
  }

  protected salvarCategoria(categoria: ICategoriaTrilha): void {
    this.executar(`categoria-${categoria.id}`, () =>
      this.administracaoService.atualizarCategoria(categoria.id, {
        nome: categoria.nome,
        descricao: categoria.descricao,
      }),
    ).subscribe({
      next: (atualizada) => {
        this.categorias.update((categorias) =>
          categorias.map((categoriaAtual) =>
            categoriaAtual.id === atualizada.id ? atualizada : categoriaAtual,
          ),
        );
        this.sinalizarSucesso('Categoria atualizada.');
      },
      error: (erro) =>
        this.sinalizarErro(erro, 'Não foi possível salvar a categoria.'),
    });
  }

  protected criarTrilha(): void {
    if (!this.novaTrilha.titulo.trim() || !this.novaTrilha.categoriaId) return;

    this.executar('trilha-nova', () =>
      this.administracaoService.criarTrilha(this.novaTrilha),
    ).subscribe({
      next: (trilha) => {
        this.trilhas.update((trilhas) => [...trilhas, trilha]);
        this.novaTrilha = this.criarFormularioTrilha();
        this.garantirCategoriaPadrao();
        this.sinalizarSucesso('Trilha criada.');
      },
      error: (erro) =>
        this.sinalizarErro(erro, 'Não foi possível criar a trilha.'),
    });
  }

  protected selecionarTrilha(trilhaId: string): void {
    if (!trilhaId) {
      this.trilhaSelecionada.set(null);
      return;
    }

    this.executar(`trilha-${trilhaId}-detalhe`, () =>
      this.administracaoService.buscarTrilha(trilhaId),
    ).subscribe({
      next: (trilha) => this.trilhaSelecionada.set(trilha),
      error: (erro) =>
        this.sinalizarErro(erro, 'Não foi possível carregar a trilha.'),
    });
  }

  protected salvarTrilha(): void {
    const trilha = this.trilhaSelecionada();
    if (!trilha) return;

    this.executar(`trilha-${trilha.id}`, () =>
      this.administracaoService.atualizarTrilha(trilha.id, {
        titulo: trilha.titulo,
        descricao: trilha.descricao,
        descricaoResumo: trilha.descricaoResumo,
        categoriaId: trilha.categoria.id,
        publicada: trilha.publicada,
      }),
    ).subscribe({
      next: (atualizada) => {
        this.trilhas.update((trilhas) =>
          trilhas.map((trilhaAtual) =>
            trilhaAtual.id === atualizada.id ? atualizada : trilhaAtual,
          ),
        );
        this.selecionarTrilha(atualizada.id);
        this.sinalizarSucesso('Trilha atualizada.');
      },
      error: (erro) =>
        this.sinalizarErro(erro, 'Não foi possível salvar a trilha.'),
    });
  }

  protected criarModulo(): void {
    const trilha = this.trilhaSelecionada();
    if (!trilha || !this.novoModulo.titulo.trim()) return;

    this.executar('modulo-novo', () =>
      this.administracaoService.criarModulo(trilha.id, this.novoModulo),
    ).subscribe({
      next: () => {
        this.novoModulo = this.criarFormularioModulo();
        this.selecionarTrilha(trilha.id);
        this.sinalizarSucesso('Módulo criado.');
      },
      error: (erro) =>
        this.sinalizarErro(erro, 'Não foi possível criar o módulo.'),
    });
  }

  protected salvarModulo(modulo: IModuloAdministrativo): void {
    this.executar(`modulo-${modulo.id}`, () =>
      this.administracaoService.atualizarModulo(modulo.id, {
        titulo: modulo.titulo,
        ordem: modulo.ordem,
        publicado: modulo.publicado,
      }),
    ).subscribe({
      next: () => {
        this.recarregarTrilhaAtual();
        this.sinalizarSucesso('Módulo atualizado.');
      },
      error: (erro) =>
        this.sinalizarErro(erro, 'Não foi possível salvar o módulo.'),
    });
  }

  protected criarLicao(moduloId: string): void {
    if (!this.novaLicao.titulo.trim()) return;

    this.executar('licao-nova', () =>
      this.administracaoService.criarLicao(moduloId, this.novaLicao),
    ).subscribe({
      next: () => {
        this.novaLicao = this.criarFormularioLicao();
        this.recarregarTrilhaAtual();
        this.sinalizarSucesso('Lição criada.');
      },
      error: (erro) =>
        this.sinalizarErro(erro, 'Não foi possível criar a lição.'),
    });
  }

  protected salvarLicao(licao: ILicaoAdministrativa): void {
    this.executar(`licao-${licao.id}`, () =>
      this.administracaoService.atualizarLicao(licao.id, {
        titulo: licao.titulo,
        descricao: licao.descricao,
        ordem: licao.ordem,
        publicada: licao.publicada,
      }),
    ).subscribe({
      next: () => {
        this.recarregarTrilhaAtual();
        this.sinalizarSucesso('Lição atualizada.');
      },
      error: (erro) =>
        this.sinalizarErro(erro, 'Não foi possível salvar a lição.'),
    });
  }

  protected criarConteudo(licaoId: string): void {
    if (!this.novoConteudo.texto && !this.novoConteudo.url) return;

    this.executar('conteudo-novo', () =>
      this.administracaoService.criarConteudo(licaoId, this.novoConteudo),
    ).subscribe({
      next: () => {
        this.novoConteudo = this.criarFormularioConteudo();
        this.recarregarTrilhaAtual();
        this.sinalizarSucesso('Conteúdo criado.');
      },
      error: (erro) =>
        this.sinalizarErro(erro, 'Não foi possível criar o conteúdo.'),
    });
  }

  protected salvarConteudo(conteudo: IConteudoLicaoAdministrativo): void {
    this.executar(`conteudo-${conteudo.id}`, () =>
      this.administracaoService.atualizarConteudo(conteudo.id, {
        tipo: conteudo.tipo,
        titulo: conteudo.titulo,
        texto: conteudo.texto,
        url: conteudo.url,
        ordem: conteudo.ordem,
        publicado: conteudo.publicado,
      }),
    ).subscribe({
      next: () => {
        this.recarregarTrilhaAtual();
        this.sinalizarSucesso('Conteúdo atualizado.');
      },
      error: (erro) =>
        this.sinalizarErro(erro, 'Não foi possível salvar o conteúdo.'),
    });
  }

  protected criarMissao(): void {
    if (!this.novaMissao.titulo.trim()) return;

    this.executar('missao-nova', () =>
      this.administracaoService.criarMissao(this.novaMissao),
    ).subscribe({
      next: (missao) => {
        this.missoes.update((missoes) => [...missoes, missao]);
        this.novaMissao = this.criarFormularioMissao();
        this.sinalizarSucesso('Missão criada.');
      },
      error: (erro) =>
        this.sinalizarErro(erro, 'Não foi possível criar a missão.'),
    });
  }

  protected salvarMissao(missao: IMissao): void {
    this.executar(`missao-${missao.id}`, () =>
      this.administracaoService.atualizarMissao(missao.id, {
        titulo: missao.titulo,
        descricao: missao.descricao,
        tipo: missao.tipo,
        xpRecompensa: missao.xpRecompensa,
        objetivo: missao.objetivo,
        ativa: missao.ativa,
        inicioEm: this.normalizarDataFormulario(missao.inicioEm),
        fimEm: this.normalizarDataFormulario(missao.fimEm),
      }),
    ).subscribe({
      next: (atualizada) => {
        this.missoes.update((missoes) =>
          missoes.map((missaoAtual) =>
            missaoAtual.id === atualizada.id ? atualizada : missaoAtual,
          ),
        );
        this.sinalizarSucesso('Missão atualizada.');
      },
      error: (erro) =>
        this.sinalizarErro(erro, 'Não foi possível salvar a missão.'),
    });
  }

  protected criarConquista(): void {
    if (
      !this.novaConquista.codigo.trim() ||
      !this.novaConquista.titulo.trim()
    ) {
      return;
    }

    this.executar('conquista-nova', () =>
      this.administracaoService.criarConquista(this.novaConquista),
    ).subscribe({
      next: (conquista) => {
        this.conquistas.update((conquistas) => [...conquistas, conquista]);
        this.novaConquista = this.criarFormularioConquista();
        this.sinalizarSucesso('Conquista criada.');
      },
      error: (erro) =>
        this.sinalizarErro(erro, 'Não foi possível criar a conquista.'),
    });
  }

  protected salvarConquista(conquista: IConquista): void {
    this.executar(`conquista-${conquista.id}`, () =>
      this.administracaoService.atualizarConquista(conquista.id, {
        codigo: conquista.codigo,
        titulo: conquista.titulo,
        descricao: conquista.descricao,
        icone: conquista.icone,
        xpRecompensa: conquista.xpRecompensa,
        tipoCriterio: conquista.tipoCriterio,
        valorCriterio: conquista.valorCriterio,
        criterio: conquista.criterio,
        ativa: conquista.ativa,
      }),
    ).subscribe({
      next: (atualizada) => {
        this.conquistas.update((conquistas) =>
          conquistas.map((conquistaAtual) =>
            conquistaAtual.id === atualizada.id ? atualizada : conquistaAtual,
          ),
        );
        this.sinalizarSucesso('Conquista atualizada.');
      },
      error: (erro) =>
        this.sinalizarErro(erro, 'Não foi possível salvar a conquista.'),
    });
  }

  protected formatarDataFormulario(
    valor: Date | string | null | undefined,
  ): string {
    if (!valor) return '';
    const data = valor instanceof Date ? valor : new Date(valor);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    const hora = String(data.getHours()).padStart(2, '0');
    const minuto = String(data.getMinutes()).padStart(2, '0');
    return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
  }

  private executar<T>(chave: string, acao: () => Observable<T>) {
    this.salvando.set(chave);
    this.erro.set(null);
    this.sucesso.set(null);
    return acao();
  }

  private sinalizarSucesso(mensagem: string): void {
    this.sucesso.set(mensagem);
    this.salvando.set(null);
  }

  private sinalizarErro(erro: unknown, fallback: string): void {
    this.erro.set(this.extrairMensagemErro(erro, fallback));
    this.salvando.set(null);
  }

  private extrairMensagemErro(erro: unknown, fallback: string): string {
    const resposta = erro as { error?: { message?: string | string[] } };
    const mensagem = resposta?.error?.message;
    if (Array.isArray(mensagem)) return mensagem[0];
    if (typeof mensagem === 'string') return mensagem;
    return fallback;
  }

  private recarregarTrilhaAtual(): void {
    const trilhaId = this.trilhaSelecionada()?.id;
    if (trilhaId) this.selecionarTrilha(trilhaId);
  }

  private garantirCategoriaPadrao(): void {
    const primeiraCategoria = this.categorias()[0];
    if (primeiraCategoria && !this.novaTrilha.categoriaId) {
      this.novaTrilha.categoriaId = primeiraCategoria.id;
    }
  }

  private normalizarDataFormulario(
    valor: Date | string | null | undefined,
  ): string | null {
    return valor ? this.formatarDataFormulario(valor) : null;
  }

  private converterFiltrosEstatisticas(): FiltrosEstatisticasConsulta | null {
    const inicio = this.criarDataUtc(this.filtrosEstatisticas.inicio);
    const fimInclusivo = this.criarDataUtc(this.filtrosEstatisticas.fim);

    if (!inicio || !fimInclusivo || inicio.getTime() > fimInclusivo.getTime()) {
      return null;
    }

    const fim = new Date(fimInclusivo);
    fim.setUTCDate(fim.getUTCDate() + 1);

    return {
      inicio,
      fim,
      agrupamento: this.filtrosEstatisticas.agrupamento,
    };
  }

  private baixarArquivoCsv(arquivo: Blob): void {
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estatisticas-tcc-${this.filtrosEstatisticas.inicio}-${this.filtrosEstatisticas.fim}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private criarDataUtc(valor: string): Date | null {
    const partes = valor.split('-').map(Number);
    if (partes.length !== 3 || partes.some((parte) => Number.isNaN(parte))) {
      return null;
    }

    const [ano, mes, dia] = partes;
    return new Date(Date.UTC(ano, mes - 1, dia));
  }

  private formatarDataBrasileira(data: Date): string {
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(data);
  }

  private formatarDataCampo(data: Date): string {
    return data.toISOString().slice(0, 10);
  }

  private criarFormularioEstatisticas(): FormularioEstatisticas {
    const fim = new Date();
    const inicio = new Date(fim);
    inicio.setUTCDate(inicio.getUTCDate() - 30);

    return {
      inicio: this.formatarDataCampo(inicio),
      fim: this.formatarDataCampo(fim),
      agrupamento: 'dia',
    };
  }

  private criarFormularioCategoria() {
    return { nome: '', descricao: '' };
  }

  private criarFormularioTrilha(): ICriarTrilha {
    return {
      titulo: '',
      descricao: '',
      descricaoResumo: '',
      categoriaId: this.categorias()[0]?.id ?? '',
      publicada: false,
    };
  }

  private criarFormularioModulo(): ICriarModulo {
    return { titulo: '', ordem: 0, publicado: false };
  }

  private criarFormularioLicao(): ICriarLicao {
    return { titulo: '', descricao: '', ordem: 0, publicada: false };
  }

  private criarFormularioConteudo(): ICriarConteudoLicao {
    return {
      tipo: 'texto',
      titulo: '',
      texto: '',
      url: '',
      ordem: 0,
      publicado: false,
    };
  }

  private criarFormularioMissao(): ICriarMissao {
    return {
      titulo: '',
      descricao: '',
      tipo: 'diaria',
      xpRecompensa: 0,
      objetivo: '',
      ativa: true,
      inicioEm: null,
      fimEm: null,
    };
  }

  private criarFormularioConquista(): ICriarConquista {
    return {
      codigo: '',
      titulo: '',
      descricao: '',
      icone: 'estrela',
      xpRecompensa: 0,
      tipoCriterio: 'licoes_concluidas',
      valorCriterio: 1,
      criterio: '',
      ativa: true,
    };
  }
}
