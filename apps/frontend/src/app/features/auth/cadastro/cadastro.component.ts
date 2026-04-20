import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AutenticacaoService } from '../../../core/services/autenticacao.service';

@Component({
  standalone: true,
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.scss',
})
export class CadastroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly autenticacaoService = inject(AutenticacaoService);
  private readonly router = inject(Router);

  protected readonly formulario = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected cadastrar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);

    const { nome, email, senha } = this.formulario.getRawValue();

    this.autenticacaoService
      .registrar(nome ?? '', email ?? '', senha ?? '')
      .subscribe({
      next: () => this.router.navigate(['/app/dashboard']),
      error: (erro) => {
        this.erro.set(this.extrairMensagemErro(erro));
        this.carregando.set(false);
      },
      });
  }

  private extrairMensagemErro(erro: unknown): string {
    const resposta = erro as { error?: { message?: string | string[] } };
    const mensagem = resposta?.error?.message;
    if (Array.isArray(mensagem)) return mensagem[0];
    if (typeof mensagem === 'string') return mensagem;
    return 'Não foi possível criar o usuário.';
  }
}
