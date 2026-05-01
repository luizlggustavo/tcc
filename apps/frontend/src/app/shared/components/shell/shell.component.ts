import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EMPTY, catchError } from 'rxjs';
import { EstatisticasService } from '../../../core/services/estatisticas.service';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  private readonly estatisticasService = inject(EstatisticasService);

  protected readonly sidebarAberta = signal(false);

  ngOnInit(): void {
    this.estatisticasService
      .registrarAcesso()
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  protected alternarSidebar(): void {
    this.sidebarAberta.update((aberta) => !aberta);
  }

  protected fecharSidebar(): void {
    this.sidebarAberta.set(false);
  }
}
