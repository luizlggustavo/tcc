import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TrilhasService } from '../../../core/services/trilhas.service';
import { DetalheTrilhaComponent } from './detalhe-trilha.component';

describe('DetalheTrilhaComponent', () => {
  let fixture: ComponentFixture<DetalheTrilhaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalheTrilhaComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ trilhaId: 'trilha-1' }),
            },
          },
        },
        {
          provide: TrilhasService,
          useValue: {
            buscarDetalhe: jest.fn().mockReturnValue(
              of({
                id: 'trilha-1',
                titulo: 'Angular',
                descricao: 'Trilha completa',
                descricaoResumo: 'Fundamentos',
                categoria: {
                  id: 'categoria-1',
                  nome: 'Programação',
                },
                progresso: {
                  trilhaId: 'trilha-1',
                  totalLicoes: 2,
                  licoesConcluidas: 1,
                  percentualConclusao: 50,
                },
                modulos: [
                  {
                    id: 'modulo-1',
                    titulo: 'Primeiros passos',
                    ordem: 1,
                    licoes: [
                      {
                        id: 'licao-1',
                        titulo: 'Componentes',
                        descricao: 'Criação de componentes',
                        ordem: 1,
                        concluida: true,
                      },
                    ],
                  },
                ],
              }),
            ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalheTrilhaComponent);
  });

  it('deve renderizar os dados da trilha e seus módulos', () => {
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Angular');
    expect(texto).toContain('Primeiros passos');
    expect(texto).toContain('50% concluído');
    expect(texto).toContain('Concluída');
  });
});
