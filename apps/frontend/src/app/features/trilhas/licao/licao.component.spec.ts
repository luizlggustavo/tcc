import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AutenticacaoService } from '../../../core/services/autenticacao.service';
import { TrilhasService } from '../../../core/services/trilhas.service';
import { LicaoComponent } from './licao.component';

describe('LicaoComponent', () => {
  let fixture: ComponentFixture<LicaoComponent>;
  let trilhasServiceMock: {
    buscarLicao: jest.Mock;
    concluirLicao: jest.Mock;
  };
  let autenticacaoServiceMock: {
    atualizarProgressoAtual: jest.Mock;
  };

  beforeEach(async () => {
    autenticacaoServiceMock = {
      atualizarProgressoAtual: jest.fn(),
    };
    trilhasServiceMock = {
      buscarLicao: jest.fn().mockReturnValue(
        of({
          id: 'licao-1',
          titulo: 'Componentes',
          descricao: 'Criação de componentes',
          ordem: 1,
          concluida: false,
          trilha: {
            id: 'trilha-1',
            titulo: 'Angular',
          },
          modulo: {
            id: 'modulo-1',
            titulo: 'Primeiros passos',
          },
          conteudos: [
            {
              id: 'conteudo-1',
              tipo: 'texto',
              titulo: 'Introdução',
              texto: 'Conteúdo textual da lição',
              ordem: 1,
            },
          ],
        }),
      ),
      concluirLicao: jest.fn().mockReturnValue(
        of({
          licaoId: 'licao-1',
          concluida: true,
          concluidaEm: new Date(),
          progressoTrilha: {
            trilhaId: 'trilha-1',
            totalLicoes: 1,
            licoesConcluidas: 1,
            percentualConclusao: 100,
          },
          progressoUsuario: {
            xpTotal: 10,
            nivel: 1,
            sequenciaDias: 1,
          },
          tempoEstudo: null,
          eventoXp: {
            id: 'evento-1',
            usuarioId: 'usuario-1',
            quantidade: 10,
            tipoOrigem: 'conclusao_licao',
            referenciaOrigemId: 'licao-1',
            xpTotalAposEvento: 10,
            nivelAposEvento: 1,
            criadoEm: new Date(),
          },
          conquistasDesbloqueadas: [],
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [LicaoComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({
                trilhaId: 'trilha-1',
                licaoId: 'licao-1',
              }),
            },
          },
        },
        {
          provide: TrilhasService,
          useValue: trilhasServiceMock,
        },
        {
          provide: AutenticacaoService,
          useValue: autenticacaoServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LicaoComponent);
  });

  it('deve renderizar conteúdo textual publicado', () => {
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Componentes');
    expect(texto).toContain('Conteúdo textual da lição');
  });

  it('deve concluir lição e atualizar estado visual', () => {
    fixture.detectChanges();

    const botao: HTMLButtonElement =
      fixture.nativeElement.querySelector('.licao__botao-concluir');
    botao.click();
    fixture.detectChanges();

    expect(trilhasServiceMock.concluirLicao).toHaveBeenCalledWith(
      'trilha-1',
      'licao-1',
      expect.any(Number),
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Lição concluída com sucesso. +10 XP',
    );
    expect(autenticacaoServiceMock.atualizarProgressoAtual).toHaveBeenCalledWith(
      { xpTotal: 10, nivel: 1, sequenciaDias: 1 },
    );
    expect(
      fixture.nativeElement.querySelector('.licao__botao-concluir').textContent,
    ).toContain('Lição concluída');
  });
});
