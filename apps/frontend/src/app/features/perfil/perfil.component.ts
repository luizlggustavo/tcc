import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IEventoXp } from '@tcc/interfaces';
import { forkJoin } from 'rxjs';
import { AutenticacaoService } from '../../core/services/autenticacao.service';
import { XpService } from '../../core/services/xp.service';

@Component({
  standalone: true,
  selector: 'app-perfil',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly autenticacaoService = inject(AutenticacaoService);
  private readonly xpService = inject(XpService);

  protected readonly perfil = this.autenticacaoService.perfilAtual;
  protected readonly historicoXp = signal<IEventoXp[]>([]);
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly sucesso = signal<string | null>(null);

  protected readonly formulario = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    forkJoin({
      perfil: this.autenticacaoService.carregarPerfil(),
      historicoXp: this.xpService.listarHistorico(),
    }).subscribe({
      next: ({ perfil, historicoXp }) => {
        this.formulario.patchValue({
          nome: perfil.usuario.nome,
          email: perfil.usuario.email,
        });
        this.historicoXp.set(historicoXp);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar seus dados.');
        this.carregando.set(false);
      },
    });
  }

  protected salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);
    this.sucesso.set(null);

    const { nome, email } = this.formulario.getRawValue();

    this.autenticacaoService
      .atualizarPerfil({ nome: nome ?? undefined, email: email ?? undefined })
      .subscribe({
        next: (perfil) => {
          this.formulario.patchValue({
            nome: perfil.usuario.nome,
            email: perfil.usuario.email,
          });
          this.sucesso.set('Perfil atualizado com sucesso.');
          this.salvando.set(false);
        },
        error: (erro) => {
          this.erro.set(this.extrairMensagemErro(erro));
          this.salvando.set(false);
        },
      });
  }

  private extrairMensagemErro(erro: unknown): string {
    const resposta = erro as { error?: { message?: string | string[] } };
    const mensagem = resposta?.error?.message;
    if (Array.isArray(mensagem)) return mensagem[0];
    if (typeof mensagem === 'string') return mensagem;
    return 'Não foi possível atualizar o perfil.';
  }

  protected descreverOrigemXp(evento: IEventoXp): string {
    if (evento.tipoOrigem === 'conclusao_licao') return 'Conclusão de lição';
    return 'Evento de XP';
  }
}
