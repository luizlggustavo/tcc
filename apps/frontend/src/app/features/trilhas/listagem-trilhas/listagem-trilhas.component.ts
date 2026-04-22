import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IResumoTrilha } from '@tcc/interfaces';
import { TrilhasService } from '../../../core/services/trilhas.service';

@Component({
  standalone: true,
  selector: 'app-listagem-trilhas',
  imports: [FormsModule, RouterLink],
  templateUrl: './listagem-trilhas.component.html',
  styleUrl: './listagem-trilhas.component.scss',
})
export class ListagemTrilhasComponent implements OnInit {
  private readonly trilhasService = inject(TrilhasService);

  protected readonly trilhas = signal<IResumoTrilha[]>([]);
  protected readonly categoriaSelecionada = signal('');
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);

  protected readonly categorias = computed(() => {
    const categorias = new Map<string, string>();

    for (const trilha of this.trilhas()) {
      categorias.set(trilha.categoria.id, trilha.categoria.nome);
    }

    return Array.from(categorias, ([id, nome]) => ({ id, nome })).sort((a, b) =>
      a.nome.localeCompare(b.nome),
    );
  });

  protected readonly trilhasFiltradas = computed(() => {
    const categoriaId = this.categoriaSelecionada();
    if (!categoriaId) return this.trilhas();
    return this.trilhas().filter(
      (trilha) => trilha.categoria.id === categoriaId,
    );
  });

  ngOnInit(): void {
    this.trilhasService.listarPublicadas().subscribe({
      next: (trilhas) => {
        this.trilhas.set(trilhas);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar as trilhas.');
        this.carregando.set(false);
      },
    });
  }

  protected selecionarCategoria(categoriaId: string): void {
    this.categoriaSelecionada.set(categoriaId);
  }
}
