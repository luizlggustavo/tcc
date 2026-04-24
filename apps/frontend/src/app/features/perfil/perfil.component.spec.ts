import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { IPerfilUsuario } from '@tcc/interfaces';
import { of } from 'rxjs';
import { AutenticacaoService } from '../../core/services/autenticacao.service';
import { XpService } from '../../core/services/xp.service';
import { PerfilComponent } from './perfil.component';

describe('PerfilComponent', () => {
  let fixture: ComponentFixture<PerfilComponent>;
  let perfilAtual: WritableSignal<IPerfilUsuario | null>;

  const perfil: IPerfilUsuario = {
    usuario: {
      id: 'usuario-1',
      nome: 'Ana Silva',
      email: 'ana@email.com',
      papel: 'estudante',
    },
    progresso: {
      xpTotal: 10,
      nivel: 1,
      sequenciaDias: 2,
    },
  };

  beforeEach(async () => {
    perfilAtual = signal<IPerfilUsuario | null>(null);

    await TestBed.configureTestingModule({
      imports: [PerfilComponent],
      providers: [
        {
          provide: AutenticacaoService,
          useValue: {
            perfilAtual: perfilAtual.asReadonly(),
            carregarPerfil: jest.fn().mockImplementation(() => {
              perfilAtual.set(perfil);
              return of(perfil);
            }),
            atualizarPerfil: jest.fn(),
          },
        },
        {
          provide: XpService,
          useValue: {
            listarHistorico: jest.fn().mockReturnValue(
              of([
                {
                  id: 'evento-1',
                  usuarioId: 'usuario-1',
                  quantidade: 10,
                  tipoOrigem: 'conclusao_licao',
                  referenciaOrigemId: 'licao-1',
                  xpTotalAposEvento: 10,
                  nivelAposEvento: 1,
                  criadoEm: new Date('2026-06-03T12:00:00.000Z'),
                },
              ]),
            ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilComponent);
  });

  it('deve renderizar progresso e histórico de XP', () => {
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('XP total');
    expect(texto).toContain('10');
    expect(texto).toContain('Sequência');
    expect(texto).toContain('2 dias');
    expect(texto).toContain('Histórico de XP');
    expect(texto).toContain('Conclusão de lição');
    expect(texto).toContain('+10 XP');
  });
});
