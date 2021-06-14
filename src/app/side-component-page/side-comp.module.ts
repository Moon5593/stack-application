import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SideCompPage } from './side-comp.page';
import { QuestionModalComponent } from '../pages/question-modal/question-modal.component';
import { SharedModule } from '../pages/shared.module';

@NgModule({
  imports: [
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    SharedModule
  ],
  declarations: [SideCompPage, QuestionModalComponent],
  exports: [SideCompPage],
  entryComponents: [QuestionModalComponent]
})
export class SideCompPageModule {}
