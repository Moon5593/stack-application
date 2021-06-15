import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { QuestionCardPage } from './question-card.page';
import { QuestionCardRoutingModule } from './question-card.routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    QuestionCardRoutingModule
  ],
  declarations: [QuestionCardPage],
  exports: [QuestionCardPage]
})
export class QuestionCardPageModule {}
