import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Comment } from 'src/app/models/comment.model';
import { AppDataService } from 'src/app/services & shared/app-data.service';

@Component({
  selector: 'app-answer',
  templateUrl: './answer.page.html',
  styleUrls: ['./answer.page.scss'],
})
export class AnswerPage implements OnInit, OnDestroy {
  listComments: Comment[];
  isLoading: boolean;
  commentsSub: Subscription;
  cLoadingSub: Subscription;

  constructor(private appDataService: AppDataService){}

  ngOnInit() {
    this.commentsSub = this.appDataService.tComments.subscribe(comments=>{
      comments.map((c, i)=>{
        if(c.userImage){
          if(!c.userImage.startsWith('data:image/jpeg;base64,')){
            c.userImage = 'data:image/jpeg;base64,'+c.userImage;
          }
        }
      });
      this.listComments = comments;
    });

    this.isLoading = true;
    this.cLoadingSub = this.appDataService.cLoadingEmitter.subscribe(loading=>{
      console.log(loading);
      this.isLoading = loading;
    });
  }

  ngOnDestroy(){
    if(this.commentsSub){
      this.commentsSub.unsubscribe();
    }
    if(this.cLoadingSub){
      this.cLoadingSub.unsubscribe();
    }
  }

}
