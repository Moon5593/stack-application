import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomePageDetailPage } from './home-page-detail.page';

const routes: Routes = [
  {
    path: '',
    component: HomePageDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomePageRoutingModule {}