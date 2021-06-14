import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HomePageDetailPage } from './home-page-detail.page';
import { HomePageRoutingModule } from './home-page-routing.module';
import { QuestionCardPageModule } from '../question-card/question-card.module';
import { SideCompPageModule } from '../../side-component-page/side-comp.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    QuestionCardPageModule,
    SideCompPageModule
  ],
  declarations: [HomePageDetailPage]
})
export class HomePageDetailPageModule {}
