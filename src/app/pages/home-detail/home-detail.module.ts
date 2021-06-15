import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HomeDetailPage } from './home-detail.page';
import { HomePageRoutingModule } from './home-routing.module';
import { QuestionCardPageModule } from '../question-card/question-card.module';
import { SideCompPageModule } from '../side-component/side-comp.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    QuestionCardPageModule,
    SideCompPageModule
  ],
  declarations: [HomeDetailPage]
})
export class HomePageDetailPageModule {}
