import { Component, OnInit, inject, signal } from '@angular/core';
import { AutenticacaoService } from '../../core/services/autenticacao.service';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly autenticacaoService = inject(AutenticacaoService);

  protected readonly perfil = this.autenticacaoService.perfilAtual;
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);

  ngOnInit(): void {
    this.autenticacaoService.carregarPerfil().subscribe({
      next: () => this.carregando.set(false),
      error: () => {
        this.erro.set('Não foi possível carregar seu progresso.');
        this.carregando.set(false);
      },
    });
  }
}
