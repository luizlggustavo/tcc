import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TrilhasService } from '../../../core/services/trilhas.service';
import { ListagemTrilhasComponent } from './listagem-trilhas.component';

describe('ListagemTrilhasComponent', () => {
  let fixture: ComponentFixture<ListagemTrilhasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListagemTrilhasComponent],
      providers: [
        provideRouter([]),
        {
          provide: TrilhasService,
          useValue: {
            listarPublicadas: jest.fn().mockReturnValue(of([])),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListagemTrilhasComponent);
  });

  it('deve exibir estado vazio quando não houver trilhas publicadas', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Nenhuma trilha publicada no momento.',
    );
  });
});
