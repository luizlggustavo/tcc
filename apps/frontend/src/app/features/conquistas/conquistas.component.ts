import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { IResumoConquistaUsuario } from '@tcc/interfaces';
import { ConquistasService } from '../../core/services/conquistas.service';

type FiltroConquista = 'todas' | 'obtidas' | 'pendentes';

interface OpcaoFiltroConquista {
  valor: FiltroConquista;
  rotulo: string;
}

@Component({
  standalone: true,
  selector: 'app-conquistas',
  imports: [DatePipe],
  templateUrl: './conquistas.component.html',
  styleUrl: './conquistas.component.scss',
})
export class ConquistasComponent implements OnInit {
  private readonly conquistasService = inject(ConquistasService);

  protected readonly conquistas = signal<IResumoConquistaUsuario[]>([]);
  protected readonly filtroSelecionado = signal<FiltroConquista>('todas');
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);

  protected readonly opcoesFiltro: OpcaoFiltroConquista[] = [
    { valor: 'todas', rotulo: 'Todas' },
    { valor: 'obtidas', rotulo: 'Obtidas' },
    { valor: 'pendentes', rotulo: 'Pendentes' },
  ];

  protected readonly totalObtidas = computed(
    () => this.conquistas().filter((item) => item.desbloqueada).length,
  );

  protected readonly conquistasFiltradas = computed(() => {
    const filtro = this.filtroSelecionado();
    if (filtro === 'obtidas') {
      return this.conquistas().filter((item) => item.desbloqueada);
    }
    if (filtro === 'pendentes') {
      return this.conquistas().filter((item) => !item.desbloqueada);
    }
    return this.conquistas();
  });

  protected obterSimboloConquista(icone: string): string {
    const iconeNormalizado = icone
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (iconeNormalizado.includes('trofeu')) return '🏆';
    if (iconeNormalizado.includes('estrela')) return '⭐';
    if (iconeNormalizado.includes('medalha')) return '🥇';
    if (iconeNormalizado.includes('coroa')) return '👑';
    if (iconeNormalizado.includes('livro')) return '📚';
    if (iconeNormalizado.includes('alvo')) return '🎯';
    if (iconeNormalizado.includes('raio')) return '⚡';

    return '🏅';
  }

  ngOnInit(): void {
    this.conquistasService.listar().subscribe({
      next: (conquistas) => {
        this.conquistas.set(conquistas);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar suas conquistas.');
        this.carregando.set(false);
      },
    });
  }

  protected selecionarFiltro(filtro: FiltroConquista): void {
    this.filtroSelecionado.set(filtro);
  }
}
