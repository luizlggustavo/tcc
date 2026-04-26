import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { IPerfilUsuario } from '@tcc/interfaces';
import { of } from 'rxjs';
import { AutenticacaoService } from '../../core/services/autenticacao.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let perfilAtual: WritableSignal<IPerfilUsuario | null>;

  const perfil: IPerfilUsuario = {
    usuario: {
      id: 'usuario-1',
      nome: 'Ana Silva',
      email: 'ana@email.com',
      papel: 'estudante',
    },
    progresso: {
      xpTotal: 40,
      nivel: 1,
      sequenciaDias: 3,
    },
  };

  beforeEach(async () => {
    perfilAtual = signal<IPerfilUsuario | null>(null);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        {
          provide: AutenticacaoService,
          useValue: {
            perfilAtual: perfilAtual.asReadonly(),
            carregarPerfil: jest.fn().mockImplementation(() => {
              perfilAtual.set(perfil);
              return of(perfil);
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
  });

  it('deve renderizar a sequência ativa do usuário', () => {
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Sequência ativa');
    expect(texto).toContain('3 dias');
    expect(texto).toContain('XP total');
    expect(texto).toContain('40');
  });
});
