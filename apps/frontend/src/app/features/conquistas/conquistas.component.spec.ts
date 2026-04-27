import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IResumoConquistaUsuario } from '@tcc/interfaces';
import { of } from 'rxjs';
import { ConquistasService } from '../../core/services/conquistas.service';
import { ConquistasComponent } from './conquistas.component';

describe('ConquistasComponent', () => {
  let fixture: ComponentFixture<ConquistasComponent>;

  const conquistas: IResumoConquistaUsuario[] = [
    {
      conquista: {
        id: 'conquista-1',
        titulo: 'Primeira lição',
        descricao: 'Concluiu a primeira lição da jornada.',
        icone: 'estrela',
        xpRecompensa: 0,
        tipoCriterio: 'licoes_concluidas',
        valorCriterio: 1,
        criterio: 'Concluir 1 lição.',
        ativa: true,
      },
      desbloqueada: true,
      conquistadoEm: new Date('2026-06-05T12:00:00.000Z'),
    },
    {
      conquista: {
        id: 'conquista-2',
        titulo: '100 XP',
        descricao: 'Alcançou 100 XP acumulados.',
        icone: 'trofeu',
        xpRecompensa: 0,
        tipoCriterio: 'xp_total',
        valorCriterio: 100,
        criterio: 'Acumular 100 XP.',
        ativa: true,
      },
      desbloqueada: false,
      conquistadoEm: null,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConquistasComponent],
      providers: [
        {
          provide: ConquistasService,
          useValue: {
            listar: jest.fn().mockReturnValue(of(conquistas)),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConquistasComponent);
  });

  it('deve renderizar conquistas obtidas e pendentes', () => {
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Conquistas');
    expect(texto).toContain('Primeira lição');
    expect(texto).toContain('Obtida');
    expect(texto).toContain('100 XP');
    expect(texto).toContain('Pendente');
  });
});
