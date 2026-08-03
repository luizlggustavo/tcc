import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
  });

  it('deve expor a barra superior como banner acessível', () => {
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('header');
    const botao = header?.querySelector('button');

    expect(header?.getAttribute('role')).toBe('banner');
    expect(botao?.getAttribute('aria-label')).toBe('Abrir menu de navegação');
  });

  it('deve exibir o subtítulo da marca no cabeçalho', () => {
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Transforme estudos em conquistas');
  });
});
