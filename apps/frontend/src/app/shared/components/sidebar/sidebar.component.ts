import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AutenticacaoService } from '../../../core/services/autenticacao.service';

interface ItemMenu {
  rotulo: string;
  rota: string;
  visivel: (papel?: string) => boolean;
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
    const papel = this.autenticacaoService.usuarioAtual()?.papel;
    const itens: ItemMenu[] = [
      { rotulo: 'Dashboard', rota: '/app/dashboard', visivel: () => true },
      { rotulo: 'Perfil', rota: '/app/perfil', visivel: () => true },
      { rotulo: 'Trilhas', rota: '/app/trilhas', visivel: () => true },
      { rotulo: 'Missões', rota: '/app/missoes', visivel: () => true },
      { rotulo: 'Conquistas', rota: '/app/conquistas', visivel: () => true },
      { rotulo: 'Ranking', rota: '/app/ranking', visivel: () => true },
      {
        rotulo: 'Administração',
        rota: '/app/admin',
        visivel: (papelAtual) => papelAtual === 'administrador',
      },
    ];

    return itens.filter((item) => item.visivel(papel));
  });
}
