import { Component, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { Question } from 'src/app/models/question.model';
import { AppDataService } from 'src/app/services & shared/app-data.service';

@Component({
  selector: 'app-popular',
  templateUrl: './popular.page.html',
  styleUrls: ['./popular.page.scss'],
})
export class PopularPage implements OnInit, OnDestroy {
  listQuestions: Question[];
  isLoading: boolean = false;
  loadingSub: Subscription;
  quesSub: Subscription;

  constructor(private appDataService: AppDataService){}

  ngOnInit() {
    this.quesSub = this.appDataService.tQuestions.subscribe(questions=>{
      this.listQuestions = questions.sort((a, b)=>b.totalComments - a.totalComments).slice(0, 3);
    });

    this.loadingSub = this.appDataService.loadingEmitter.subscribe(loading=>{
      console.log(loading);
      this.isLoading = loading;
    });
  }

  ngOnDestroy(){
    if(this.loadingSub){
      this.loadingSub.unsubscribe();
    }
    if(this.quesSub){
      this.quesSub.unsubscribe();
    }
  }

}
