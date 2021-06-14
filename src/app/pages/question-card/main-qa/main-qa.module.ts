import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MainQaPageRoutingModule } from './main-qa-routing.module';
import { MainQaPage } from './main-qa.page';
import { QuestionCardPageModule } from '../question-card.module';
import { SideCompPageModule } from 'src/app/side-component-page/side-comp.module';
import { ReportComponent } from '../../report/report.component';
import { SharedModule } from '../../shared.module';

@NgModule({
  imports: [
    ReactiveFormsModule,
    IonicModule,
    MainQaPageRoutingModule,
    QuestionCardPageModule,
    SideCompPageModule,
    SharedModule
  ],
  declarations: [MainQaPage, ReportComponent],
  entryComponents: [ReportComponent]
})
export class MainQaPageModule {}
