import { Component, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IDetalheLicao } from '@tcc/interfaces';
import { AutenticacaoService } from '../../../core/services/autenticacao.service';
import { TrilhasService } from '../../../core/services/trilhas.service';

@Component({
  standalone: true,
  selector: 'app-licao',
  imports: [RouterLink],
  templateUrl: './licao.component.html',
  styleUrl: './licao.component.scss',
})
export class LicaoComponent implements OnInit {
  private readonly rota = inject(ActivatedRoute);
  private readonly sanitizador = inject(DomSanitizer);
  private readonly autenticacaoService = inject(AutenticacaoService);
  private readonly trilhasService = inject(TrilhasService);
  private trilhaId: string | null = null;
  private licaoId: string | null = null;
  private inicioEstudoEm: number | null = null;

  protected readonly licao = signal<IDetalheLicao | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly concluindo = signal(false);
  protected readonly erroConclusao = signal<string | null>(null);
  protected readonly mensagemConclusao = signal<string | null>(null);

  ngOnInit(): void {
    this.trilhaId = this.rota.snapshot.paramMap.get('trilhaId');
    this.licaoId = this.rota.snapshot.paramMap.get('licaoId');

    if (!this.trilhaId || !this.licaoId) {
      this.erro.set('Lição não encontrada.');
      this.carregando.set(false);
      return;
    }

    this.trilhasService.buscarLicao(this.trilhaId, this.licaoId).subscribe({
      next: (licao) => {
        this.licao.set(licao);
        this.inicioEstudoEm = Date.now();
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar a lição.');
        this.carregando.set(false);
      },
    });
  }

  protected concluirLicao(): void {
    const licao = this.licao();
    if (!this.trilhaId || !this.licaoId || !licao || licao.concluida) return;

    this.concluindo.set(true);
    this.erroConclusao.set(null);
    this.mensagemConclusao.set(null);

    this.trilhasService
      .concluirLicao(
        this.trilhaId,
        this.licaoId,
        this.calcularTempoEstudoSegundos(),
      )
      .subscribe({
        next: (resultado) => {
          this.licao.update((atual) =>
            atual ? { ...atual, concluida: true } : atual,
          );
          this.autenticacaoService.atualizarProgressoAtual(
            resultado.progressoUsuario,
          );
          if (resultado.eventoXp) {
            this.mensagemConclusao.set(
              `Lição concluída com sucesso. +${resultado.eventoXp.quantidade} XP`,
            );
          } else {
            this.mensagemConclusao.set('Lição concluída com sucesso.');
          }
          this.concluindo.set(false);
        },
        error: () => {
          this.erroConclusao.set('Não foi possível concluir a lição.');
          this.concluindo.set(false);
        },
      });
  }

  protected obterUrlVideo(url: string | null | undefined): SafeResourceUrl | null {
    const urlIncorporada = this.converterUrlVideo(url);
    if (!urlIncorporada) return null;
    return this.sanitizador.bypassSecurityTrustResourceUrl(urlIncorporada);
  }

  private calcularTempoEstudoSegundos(): number {
    if (!this.inicioEstudoEm) return 1;
    return Math.max(1, Math.round((Date.now() - this.inicioEstudoEm) / 1000));
  }

  private converterUrlVideo(url: string | null | undefined): string | null {
    if (!url) return null;

    try {
      const endereco = new URL(url);

      if (endereco.hostname.includes('youtube.com')) {
        const videoId = endereco.searchParams.get('v');
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      if (endereco.hostname.includes('youtu.be')) {
        const videoId = endereco.pathname.replace('/', '');
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      if (endereco.hostname.includes('vimeo.com')) {
        const videoId = endereco.pathname.replace('/', '');
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
      }

      return null;
    } catch {
      return null;
    }
  }
}
