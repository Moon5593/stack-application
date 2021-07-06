import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SideCompPage } from './side-comp.page';
import { QuestionComponent } from '../../modals/question/question.component';
import { SharedModule } from '../../services & shared/shared.module';
import { AnswerPageModule } from '../nav-container/answer-pages/answer.module';
import { PopularPageModule } from '../nav-container/popular-pages/popular.module';

@NgModule({
  imports: [
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    SharedModule,
    AnswerPageModule,
    PopularPageModule
  ],
  declarations: [SideCompPage, QuestionComponent],
  exports: [SideCompPage],
  entryComponents: [QuestionComponent]
})
export class SideCompPageModule {}
