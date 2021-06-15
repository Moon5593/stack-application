import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthResolver } from './services & shared/auth-resolve.service';
import { AuthGuard } from './services & shared/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/app/home',
    pathMatch: 'full',
  },
  {
    path: 'app',
    resolve: [AuthResolver],
    children: [
      {
        path: 'home',
        loadChildren: () => import('./pages/home-detail/home-detail.module').then( m => m.HomePageDetailPageModule)
      },
      {
        path: 'home/:questionId',
        loadChildren: () => import('./pages/question-card/main-qa/main-qa.module').then( m => m.MainQaPageModule)
      },
      {
        path: 'about',
        loadChildren: () => import('./pages/about/about.module').then( m => m.AboutPageModule)
      },
      {
        path: 'help',
        loadChildren: () => import('./pages/help/help.module').then( m => m.HelpPageModule)
      },
      {
        path: 'users',
        loadChildren: () => import('./pages/users/users.module').then( m => m.UsersPageModule),
        canLoad: [AuthGuard]
      },
      {
        path: 'vip',
        loadChildren: () => import('./pages/vip/vip.module').then( m => m.VipPageModule),
        canLoad: [AuthGuard]
      },
      {
        path: 'badges',
        loadChildren: () => import('./pages/badges/badges.module').then( m => m.BadgesPageModule)
      }
    ]
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
