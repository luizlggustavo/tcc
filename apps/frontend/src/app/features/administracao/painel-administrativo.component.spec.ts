import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdministracaoService } from '../../core/services/administracao.service';
import { EstatisticasService } from '../../core/services/estatisticas.service';
import { PainelAdministrativoComponent } from './painel-administrativo.component';

describe('PainelAdministrativoComponent', () => {
  let fixture: ComponentFixture<PainelAdministrativoComponent>;
  let estatisticasService: {
    consultarAgregado: jest.Mock;
    exportarCsv: jest.Mock;
  };

  beforeEach(async () => {
    estatisticasService = {
      consultarAgregado: jest.fn().mockReturnValue(of([])),
      exportarCsv: jest.fn().mockReturnValue(of(new Blob(['csv']))),
    };

    await TestBed.configureTestingModule({
      imports: [PainelAdministrativoComponent],
      providers: [
        {
          provide: AdministracaoService,
          useValue: {
            listarUsuarios: jest.fn().mockReturnValue(of([])),
            listarCategorias: jest.fn().mockReturnValue(of([])),
            listarTrilhas: jest.fn().mockReturnValue(of([])),
            listarMissoes: jest.fn().mockReturnValue(of([])),
            listarConquistas: jest.fn().mockReturnValue(of([])),
          },
        },
        {
          provide: EstatisticasService,
          useValue: estatisticasService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PainelAdministrativoComponent);
  });

  it('deve renderizar o painel administrativo', () => {
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelector('h1')?.textContent).toContain(
      'Administração',
    );
    expect(elemento.textContent).toContain('Usuários');
    expect(elemento.textContent).toContain('Missões');
    expect(elemento.textContent).toContain('Conquistas');
    expect(elemento.textContent).toContain('Métricas acadêmicas');
  });

  it('deve consultar métricas acadêmicas com data final inclusiva', () => {
    const componente = fixture.componentInstance as unknown as {
      filtrosEstatisticas: {
        inicio: string;
        fim: string;
        agrupamento: string;
      };
      consultarEstatisticas: () => void;
    };
    componente.filtrosEstatisticas = {
      inicio: '2026-06-01',
      fim: '2026-06-30',
      agrupamento: 'semana',
    };

    componente.consultarEstatisticas();

    expect(estatisticasService.consultarAgregado).toHaveBeenCalledWith({
      inicio: new Date('2026-06-01T00:00:00.000Z'),
      fim: new Date('2026-07-01T00:00:00.000Z'),
      agrupamento: 'semana',
    });
  });

  it('deve exportar métricas acadêmicas em CSV', () => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: jest.fn().mockReturnValue('blob:estatisticas'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: jest.fn(),
    });
    const componente = fixture.componentInstance as unknown as {
      filtrosEstatisticas: {
        inicio: string;
        fim: string;
        agrupamento: string;
      };
      exportarEstatisticas: () => void;
    };
    componente.filtrosEstatisticas = {
      inicio: '2026-06-01',
      fim: '2026-06-30',
      agrupamento: 'mes',
    };

    componente.exportarEstatisticas();

    expect(estatisticasService.exportarCsv).toHaveBeenCalledWith({
      inicio: new Date('2026-06-01T00:00:00.000Z'),
      fim: new Date('2026-07-01T00:00:00.000Z'),
      agrupamento: 'mes',
    });
  });
});
