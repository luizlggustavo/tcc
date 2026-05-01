import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Output() readonly alternarSidebar = new EventEmitter<void>();

  protected emitirAlternarSidebar(): void {
    this.alternarSidebar.emit();
  }
}
