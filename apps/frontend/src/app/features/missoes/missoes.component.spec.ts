import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IResumoMissaoUsuario } from '@tcc/interfaces';
import { of } from 'rxjs';
import { AutenticacaoService } from '../../core/services/autenticacao.service';
import { MissoesService } from '../../core/services/missoes.service';
import { MissoesComponent } from './missoes.component';

describe('MissoesComponent', () => {
  let fixture: ComponentFixture<MissoesComponent>;
  let missoesServiceMock: {
    listar: jest.Mock;
    iniciar: jest.Mock;
    concluir: jest.Mock;
  };
  let autenticacaoServiceMock: {
    atualizarProgressoAtual: jest.Mock;
  };

  const missaoDisponivel = criarResumoMissao({
    status: 'disponivel',
  });
  const missaoEmAndamento = criarResumoMissao({
    missao: {
      ...criarResumoMissao().missao,
      id: 'missao-2',
      titulo: 'Revisar conteúdo',
      tipo: 'semanal',
      xpRecompensa: 40,
    },
    status: 'em_andamento',
    cicloReferencia: '2026-W23',
    iniciadoEm: new Date('2026-06-05T12:00:00.000Z'),
  });

  beforeEach(async () => {
    autenticacaoServiceMock = {
      atualizarProgressoAtual: jest.fn(),
    };
    missoesServiceMock = {
      listar: jest
        .fn()
        .mockReturnValue(of([missaoDisponivel, missaoEmAndamento])),
      iniciar: jest.fn().mockReturnValue(
        of({
          id: 'missao-usuario-1',
          missaoId: 'missao-1',
          usuarioId: 'usuario-1',
          status: 'em_andamento',
          cicloReferencia: '2026-06-05',
          iniciadoEm: new Date('2026-06-05T12:00:00.000Z'),
          concluidoEm: null,
        }),
      ),
      concluir: jest.fn().mockReturnValue(
        of({
          missaoUsuario: {
            id: 'missao-usuario-2',
            missaoId: 'missao-2',
            usuarioId: 'usuario-1',
            status: 'concluida',
            cicloReferencia: '2026-W23',
            iniciadoEm: new Date('2026-06-05T12:00:00.000Z'),
            concluidoEm: new Date('2026-06-05T12:30:00.000Z'),
          },
          eventoXp: {
            id: 'evento-1',
            usuarioId: 'usuario-1',
            quantidade: 40,
            tipoOrigem: 'conclusao_missao',
            referenciaOrigemId: 'missao-usuario-2',
            xpTotalAposEvento: 140,
            nivelAposEvento: 2,
            criadoEm: new Date('2026-06-05T12:30:00.000Z'),
          },
          conquistasDesbloqueadas: [],
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [MissoesComponent],
      providers: [
        {
          provide: MissoesService,
          useValue: missoesServiceMock,
        },
        {
          provide: AutenticacaoService,
          useValue: autenticacaoServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MissoesComponent);
  });

  it('deve carregar e renderizar missões', () => {
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Estudar hoje');
    expect(texto).toContain('Revisar conteúdo');
    expect(texto).toContain('+20 XP');
    expect(texto).toContain('+40 XP');
  });

  it('deve iniciar missão disponível e atualizar estado visual', () => {
    fixture.detectChanges();

    const botao: HTMLButtonElement =
      fixture.nativeElement.querySelector('.missoes__botao');
    botao.click();
    fixture.detectChanges();

    expect(missoesServiceMock.iniciar).toHaveBeenCalledWith('missao-1');
    expect(fixture.nativeElement.textContent).toContain('Missão iniciada.');
    expect(fixture.nativeElement.textContent).toContain('Em andamento');
  });

  it('deve concluir missão e atualizar progresso atual', () => {
    fixture.detectChanges();

    const botoes: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.missoes__botao'),
    );
    botoes[1].click();
    fixture.detectChanges();

    expect(missoesServiceMock.concluir).toHaveBeenCalledWith('missao-2');
    expect(fixture.nativeElement.textContent).toContain(
      'Missão concluída. +40 XP',
    );
    expect(
      autenticacaoServiceMock.atualizarProgressoAtual,
    ).toHaveBeenCalledWith({ xpTotal: 140, nivel: 2 });
  });
});

function criarResumoMissao(
  sobrescritas: Partial<IResumoMissaoUsuario> = {},
): IResumoMissaoUsuario {
  return {
    missao: {
      id: 'missao-1',
      titulo: 'Estudar hoje',
      descricao: 'Concluir um objetivo de estudo.',
      tipo: 'diaria',
      xpRecompensa: 20,
      objetivo: 'conclusao_manual',
      ativa: true,
      inicioEm: null,
      fimEm: null,
      criadoEm: new Date('2026-06-01T00:00:00.000Z'),
    },
    status: 'disponivel',
    cicloReferencia: '2026-06-05',
    iniciadoEm: null,
    concluidoEm: null,
    ...sobrescritas,
  };
}
