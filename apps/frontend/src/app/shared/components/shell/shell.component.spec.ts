import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { EMPTY, throwError } from 'rxjs';
import { AutenticacaoService } from '../../../core/services/autenticacao.service';
import { EstatisticasService } from '../../../core/services/estatisticas.service';
import { ShellComponent } from './shell.component';

describe('ShellComponent', () => {
  let fixture: ComponentFixture<ShellComponent>;
  let estatisticasService: { registrarAcesso: jest.Mock };

  beforeEach(async () => {
    estatisticasService = {
      registrarAcesso: jest.fn().mockReturnValue(EMPTY),
    };

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        {
          provide: EstatisticasService,
          useValue: estatisticasService,
        },
        {
          provide: AutenticacaoService,
          useValue: {
            usuarioAtual: signal(null).asReadonly(),
            logout: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShellComponent);
  });

  it('deve registrar acesso ao inicializar', () => {
    fixture.detectChanges();

    expect(estatisticasService.registrarAcesso).toHaveBeenCalledTimes(1);
  });

  it('deve ignorar erro ao registrar acesso', () => {
    estatisticasService.registrarAcesso.mockReturnValue(
      throwError(() => new Error('Falha ao registrar acesso')),
    );

    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
