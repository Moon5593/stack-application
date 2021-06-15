import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SideCompPage } from './side-comp.page';
import { QuestionComponent } from '../../modals/question/question.component';
import { SharedModule } from '../../services & shared/shared.module';

@NgModule({
  imports: [
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    SharedModule
  ],
  declarations: [SideCompPage, QuestionComponent],
  exports: [SideCompPage],
  entryComponents: [QuestionComponent]
})
export class SideCompPageModule {}
