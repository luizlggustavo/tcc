import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IDetalheTrilha } from '@tcc/interfaces';
import { TrilhasService } from '../../../core/services/trilhas.service';

@Component({
  standalone: true,
  selector: 'app-detalhe-trilha',
  imports: [RouterLink],
  templateUrl: './detalhe-trilha.component.html',
  styleUrl: './detalhe-trilha.component.scss',
})
export class DetalheTrilhaComponent implements OnInit {
  private readonly rota = inject(ActivatedRoute);
  private readonly trilhasService = inject(TrilhasService);

  protected readonly trilha = signal<IDetalheTrilha | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);

  ngOnInit(): void {
    const trilhaId = this.rota.snapshot.paramMap.get('trilhaId');
    if (!trilhaId) {
      this.erro.set('Trilha não encontrada.');
      this.carregando.set(false);
      return;
    }

    this.trilhasService.buscarDetalhe(trilhaId).subscribe({
      next: (trilha) => {
        this.trilha.set(trilha);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar a trilha.');
        this.carregando.set(false);
      },
    });
  }
}
