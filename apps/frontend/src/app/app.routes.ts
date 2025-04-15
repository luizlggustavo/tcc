import { Route } from '@angular/router';
import { administradorGuard } from './core/guards/administrador.guard';
import { autenticadoGuard } from './core/guards/autenticado.guard';
import { visitanteGuard } from './core/guards/visitante.guard';

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    title: 'Login',
    canActivate: [visitanteGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'cadastro',
    title: 'Cadastro',
    canActivate: [visitanteGuard],
    loadComponent: () =>
      import('./features/auth/cadastro/cadastro.component').then(
        (m) => m.CadastroComponent,
      ),
  },
  {
    path: 'recuperar-senha',
    title: 'Recuperar senha',
    canActivate: [visitanteGuard],
    loadComponent: () =>
      import('./features/auth/recuperar-senha/recuperar-senha.component').then(
        (m) => m.RecuperarSenhaComponent,
      ),
  },
  {
    path: 'app',
    canActivate: [autenticadoGuard],
    loadComponent: () =>
      import('./shared/components/shell/shell.component').then(
        (m) => m.ShellComponent,
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'admin',
        title: 'Administração',
        canActivate: [administradorGuard],
        loadComponent: () =>
          import(
            './features/administracao/painel-administrativo.component'
          ).then((m) => m.PainelAdministrativoComponent),
      },
      {
        path: 'perfil',
        title: 'Meus Dados',
        loadComponent: () =>
          import('./features/perfil/perfil.component').then(
            (m) => m.PerfilComponent,
          ),
      },
      {
        path: 'trilhas',
        title: 'Trilhas',
        loadComponent: () =>
          import(
            './features/trilhas/listagem-trilhas/listagem-trilhas.component'
          ).then((m) => m.ListagemTrilhasComponent),
      },
      {
        path: 'missoes',
        title: 'Missões',
        loadComponent: () =>
          import('./features/missoes/missoes.component').then(
            (m) => m.MissoesComponent,
          ),
      },
      {
        path: 'conquistas',
        title: 'Conquistas',
        loadComponent: () =>
          import('./features/conquistas/conquistas.component').then(
            (m) => m.ConquistasComponent,
          ),
      },
      {
        path: 'ranking',
        title: 'Ranking',
        loadComponent: () =>
          import('./features/ranking/ranking.component').then(
            (m) => m.RankingComponent,
          ),
      },
      {
        path: 'trilhas/:trilhaId',
        title: 'Detalhe da Trilha',
        loadComponent: () =>
          import(
            './features/trilhas/detalhe-trilha/detalhe-trilha.component'
          ).then((m) => m.DetalheTrilhaComponent),
      },
      {
        path: 'trilhas/:trilhaId/licoes/:licaoId',
        title: 'Lição',
        loadComponent: () =>
          import('./features/trilhas/licao/licao.component').then(
            (m) => m.LicaoComponent,
          ),
      },
      {
        path: '**',
        title: 'Página não encontrada',
        data: { emShell: true },
        loadComponent: () =>
          import('./features/nao-encontrado/nao-encontrado.component').then(
            (m) => m.NaoEncontradoComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    title: 'Página não encontrada',
    loadComponent: () =>
      import('./features/nao-encontrado/nao-encontrado.component').then(
        (m) => m.NaoEncontradoComponent,
      ),
  },
];
