import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AutenticacaoService } from '../../../core/services/autenticacao.service';

interface ItemMenu {
  rotulo: string;
  rota: string;
}

@Component({
  standalone: true,
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Input() aberta = false;
  @Output() readonly navegar = new EventEmitter<void>();

  private readonly autenticacaoService = inject(AutenticacaoService);
  protected readonly usuario = this.autenticacaoService.usuarioAtual;

  protected fecharAoNavegar(): void {
    this.navegar.emit();
  }

  protected sair(): void {
    this.autenticacaoService.logout();
  }

  protected readonly itens = computed<ItemMenu[]>(() => {
    const itens: ItemMenu[] = [
      { rotulo: 'Dashboard', rota: '/app/dashboard' },
      { rotulo: 'Trilhas', rota: '/app/trilhas' },
      { rotulo: 'Missões', rota: '/app/missoes' },
      { rotulo: 'Conquistas', rota: '/app/conquistas' },
      { rotulo: 'Ranking', rota: '/app/ranking' },
      { rotulo: 'Perfil', rota: '/app/perfil' },
    ];

    if (this.autenticacaoService.usuarioAtual()?.papel === 'administrador') {
      itens.push({ rotulo: 'Administração', rota: '/app/admin' });
    }

    return itens;
  });
}
