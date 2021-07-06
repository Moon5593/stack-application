import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MainQaPageRoutingModule } from './main-qa-routing.module';
import { MainQaPage } from './main-qa.page';
import { SideCompPageModule } from 'src/app/pages/side-component/side-comp.module';
import { ReportComponent } from '../../../modals/report/report.component';
import { SharedModule } from '../../../services & shared/shared.module';

@NgModule({
  imports: [
    ReactiveFormsModule,
    FormsModule,
    IonicModule,
    MainQaPageRoutingModule,
    SideCompPageModule,
    SharedModule
  ],
  declarations: [MainQaPage, ReportComponent],
  entryComponents: [ReportComponent]
})
export class MainQaPageModule {}
