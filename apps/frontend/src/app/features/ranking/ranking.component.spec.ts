import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IRespostaRanking } from '@tcc/interfaces';
import { of } from 'rxjs';
import { RankingService } from '../../core/services/ranking.service';
import { RankingComponent } from './ranking.component';

describe('RankingComponent', () => {
  let fixture: ComponentFixture<RankingComponent>;

  const resposta: IRespostaRanking = {
    tipo: 'geral',
    limite: 50,
    periodo: null,
    entradas: [
      {
        posicao: 1,
        usuarioId: 'usuario-1',
        nomeUsuario: 'Ana',
        xp: 200,
        nivel: 3,
        usuarioAtual: false,
      },
      {
        posicao: 2,
        usuarioId: 'usuario-2',
        nomeUsuario: 'Bruno',
        xp: 120,
        nivel: 2,
        usuarioAtual: true,
      },
    ],
    minhaEntrada: {
      posicao: 2,
      usuarioId: 'usuario-2',
      nomeUsuario: 'Bruno',
      xp: 120,
      nivel: 2,
      usuarioAtual: true,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RankingComponent],
      providers: [
        {
          provide: RankingService,
          useValue: {
            listar: jest.fn().mockReturnValue(of(resposta)),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RankingComponent);
  });

  it('deve renderizar ranking e posição do usuário atual', () => {
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Ranking');
    expect(texto).toContain('Ana');
    expect(texto).toContain('200 XP');
    expect(texto).toContain('Bruno');
    expect(texto).toContain('Sua posição');
    expect(texto).toContain('#2');
  });
});
