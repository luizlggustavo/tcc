import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AutenticacaoService } from '../../../core/services/autenticacao.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly autenticacaoService = inject(AutenticacaoService);
  private readonly router = inject(Router);

  protected readonly formulario = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]],
  });

  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected entrar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);

    const { email, senha } = this.formulario.getRawValue();

    this.autenticacaoService.login(email ?? '', senha ?? '').subscribe({
      next: () => this.router.navigate(['/app/dashboard']),
      error: () => {
        this.erro.set('E-mail ou senha inválidos.');
        this.carregando.set(false);
      },
    });
  }
}
