import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-nao-encontrado',
  imports: [RouterLink],
  templateUrl: './nao-encontrado.component.html',
  styleUrl: './nao-encontrado.component.scss',
})
export class NaoEncontradoComponent {
  private readonly rotaAtiva = inject(ActivatedRoute);

  protected readonly emShell = this.rotaAtiva.snapshot.data['emShell'] === true;
}
