import { DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  IEntradaRanking,
  IPeriodoRanking,
  IRespostaRanking,
  TipoRanking,
} from '@tcc/interfaces';
import { RankingService } from '../../core/services/ranking.service';

interface OpcaoRanking {
  valor: TipoRanking;
  rotulo: string;
}

@Component({
  standalone: true,
  selector: 'app-ranking',
  imports: [DatePipe, NgClass],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.scss',
})
export class RankingComponent implements OnInit {
  private readonly rankingService = inject(RankingService);

  protected readonly tipoSelecionado = signal<TipoRanking>('geral');
  protected readonly resposta = signal<IRespostaRanking | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);

  protected readonly opcoes: OpcaoRanking[] = [
    { valor: 'geral', rotulo: 'Geral' },
    { valor: 'semanal', rotulo: 'Semanal' },
  ];

  protected readonly entradas = computed(() => this.resposta()?.entradas ?? []);
  protected readonly minhaEntrada = computed(
    () => this.resposta()?.minhaEntrada ?? null,
  );
  protected readonly usuarioAtualNoTopo = computed(() => {
    const minhaEntrada = this.minhaEntrada();
    if (!minhaEntrada) return false;

    return this.entradas().some(
      (entrada) => entrada.usuarioId === minhaEntrada.usuarioId,
    );
  });

  ngOnInit(): void {
    this.carregarRanking();
  }

  protected selecionarTipo(tipo: TipoRanking): void {
    if (this.tipoSelecionado() === tipo) return;

    this.tipoSelecionado.set(tipo);
    this.carregarRanking();
  }

  protected obterRotuloPeriodo(resposta: IRespostaRanking): string {
    if (!resposta.periodo) return 'XP acumulado total';

    return 'XP obtido nesta semana';
  }

  protected obterClassePosicao(entrada: IEntradaRanking): string {
    if (entrada.posicao === 1) return 'ranking__posicao--primeira';
    if (entrada.posicao === 2) return 'ranking__posicao--segunda';
    if (entrada.posicao === 3) return 'ranking__posicao--terceira';
    return '';
  }

  protected obterFimPeriodo(periodo: IPeriodoRanking): Date {
    const fim = new Date(periodo.fimExclusivo);
    fim.setDate(fim.getDate() - 1);
    return fim;
  }

  private carregarRanking(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.resposta.set(null);

    this.rankingService.listar(this.tipoSelecionado()).subscribe({
      next: (resposta) => {
        this.resposta.set(resposta);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar o ranking.');
        this.carregando.set(false);
      },
    });
  }
}
