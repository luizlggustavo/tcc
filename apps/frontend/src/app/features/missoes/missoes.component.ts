import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  IResultadoConclusaoMissao,
  IResumoMissaoUsuario,
  StatusMissao,
  TipoMissao,
} from '@tcc/interfaces';
import { AutenticacaoService } from '../../core/services/autenticacao.service';
import { MissoesService } from '../../core/services/missoes.service';

interface OpcaoStatus {
  valor: StatusMissao | '';
  rotulo: string;
}

@Component({
  standalone: true,
  selector: 'app-missoes',
  templateUrl: './missoes.component.html',
  styleUrl: './missoes.component.scss',
})
export class MissoesComponent implements OnInit {
  private readonly missoesService = inject(MissoesService);
  private readonly autenticacaoService = inject(AutenticacaoService);

  protected readonly missoes = signal<IResumoMissaoUsuario[]>([]);
  protected readonly statusSelecionado = signal<StatusMissao | ''>('');
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly missaoEmAcao = signal<string | null>(null);
  protected readonly mensagem = signal<string | null>(null);

  protected readonly opcoesStatus: OpcaoStatus[] = [
    { valor: '', rotulo: 'Todas' },
    { valor: 'disponivel', rotulo: 'Disponíveis' },
    { valor: 'em_andamento', rotulo: 'Em andamento' },
    { valor: 'concluida', rotulo: 'Concluídas' },
    { valor: 'expirada', rotulo: 'Expiradas' },
  ];

  protected readonly missoesFiltradas = computed(() => {
    const status = this.statusSelecionado();
    if (!status) return this.missoes();
    return this.missoes().filter((missao) => missao.status === status);
  });

  ngOnInit(): void {
    this.carregarMissoes();
  }

  protected selecionarStatus(status: StatusMissao | ''): void {
    this.statusSelecionado.set(status);
  }

  protected iniciarMissao(resumo: IResumoMissaoUsuario): void {
    if (resumo.status !== 'disponivel') return;

    this.missaoEmAcao.set(resumo.missao.id);
    this.erro.set(null);
    this.mensagem.set(null);

    this.missoesService.iniciar(resumo.missao.id).subscribe({
      next: (missaoUsuario) => {
        this.atualizarMissao(resumo.missao.id, {
          status: missaoUsuario.status,
          cicloReferencia: missaoUsuario.cicloReferencia,
          iniciadoEm: missaoUsuario.iniciadoEm,
          concluidoEm: missaoUsuario.concluidoEm,
        });
        this.mensagem.set('Missão iniciada.');
        this.missaoEmAcao.set(null);
      },
      error: () => {
        this.erro.set('Não foi possível iniciar a missão.');
        this.missaoEmAcao.set(null);
      },
    });
  }

  protected concluirMissao(resumo: IResumoMissaoUsuario): void {
    if (resumo.status !== 'em_andamento') return;

    this.missaoEmAcao.set(resumo.missao.id);
    this.erro.set(null);
    this.mensagem.set(null);

    this.missoesService.concluir(resumo.missao.id).subscribe({
      next: (resultado) => this.aplicarConclusao(resumo.missao.id, resultado),
      error: () => {
        this.erro.set('Não foi possível concluir a missão.');
        this.missaoEmAcao.set(null);
      },
    });
  }

  protected obterRotuloTipo(tipo: TipoMissao): string {
    const rotulos: Record<TipoMissao, string> = {
      diaria: 'Diária',
      semanal: 'Semanal',
      unica: 'Única',
    };
    return rotulos[tipo];
  }

  protected obterRotuloStatus(status: StatusMissao): string {
    const rotulos: Record<StatusMissao, string> = {
      disponivel: 'Disponível',
      em_andamento: 'Em andamento',
      concluida: 'Concluída',
      expirada: 'Expirada',
    };
    return rotulos[status];
  }

  private carregarMissoes(): void {
    this.missoesService.listar().subscribe({
      next: (missoes) => {
        this.missoes.set(missoes);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar as missões.');
        this.carregando.set(false);
      },
    });
  }

  private aplicarConclusao(
    missaoId: string,
    resultado: IResultadoConclusaoMissao,
  ): void {
    this.atualizarMissao(missaoId, {
      status: resultado.missaoUsuario.status,
      cicloReferencia: resultado.missaoUsuario.cicloReferencia,
      iniciadoEm: resultado.missaoUsuario.iniciadoEm,
      concluidoEm: resultado.missaoUsuario.concluidoEm,
    });

    if (resultado.eventoXp) {
      this.autenticacaoService.atualizarProgressoAtual({
        xpTotal: resultado.eventoXp.xpTotalAposEvento,
        nivel: resultado.eventoXp.nivelAposEvento,
      });
      this.mensagem.set(
        `Missão concluída. +${resultado.eventoXp.quantidade} XP`,
      );
    } else {
      this.mensagem.set('Missão concluída.');
    }

    this.missaoEmAcao.set(null);
  }

  private atualizarMissao(
    missaoId: string,
    dados: Pick<
      IResumoMissaoUsuario,
      'status' | 'cicloReferencia' | 'iniciadoEm' | 'concluidoEm'
    >,
  ): void {
    this.missoes.update((missoes) =>
      missoes.map((missao) =>
        missao.missao.id === missaoId ? { ...missao, ...dados } : missao,
      ),
    );
  }
}
