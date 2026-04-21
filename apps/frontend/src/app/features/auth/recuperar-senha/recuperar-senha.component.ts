import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AutenticacaoService } from '../../../core/services/autenticacao.service';

@Component({
  standalone: true,
  selector: 'app-recuperar-senha',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar-senha.component.html',
  styleUrl: './recuperar-senha.component.scss',
})
export class RecuperarSenhaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly autenticacaoService = inject(AutenticacaoService);

  protected readonly formulario = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly mensagem = signal<string | null>(null);

  protected solicitar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);
    this.mensagem.set(null);

    const { email } = this.formulario.getRawValue();

    this.autenticacaoService.recuperarSenha(email ?? '').subscribe({
      next: (resposta) => {
        this.mensagem.set(resposta.mensagem);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível solicitar a recuperação de senha.');
        this.carregando.set(false);
      },
    });
  }
}
