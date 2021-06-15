import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainQaPage } from './main-qa.page';

const routes: Routes = [
  {
    path: '',
    component: MainQaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainQaPageRoutingModule {}
