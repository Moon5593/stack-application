import { Component, OnDestroy, OnInit } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { ModalController } from '@ionic/angular';
import { EMPTY, from, of, Subscription } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { AppDataService } from 'src/app/app-data.service';
import { Comment } from 'src/app/comment.model';
import { Question } from 'src/app/question.model';

export interface Recents{
  id: string;
  data: string;
  post?: string;
}
@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, OnDestroy {
  comments: Comment[];
  questions: Question[];
  searchText: string;
  recents: Recents[];
  no_recents: boolean = false;
  recentsQ: Recents[]=[];
  recentsC: Recents[]=[];
  commentsC: Comment[];
  questionsQ: Question[];
  showProgress: boolean = false;
  commentsSub: Subscription;
  questionsSub: Subscription;
  totalSub: Subscription;
  loadingSub: Subscription;
  totalsC: Comment[] = [];
  loading: boolean = false;

  constructor(private appDataService: AppDataService, private modalCtrl: ModalController) { }

  ngOnInit() {
    this.commentsSub = this.appDataService.comments.subscribe(comments=>{
      this.comments = comments;
      //this.commentsC = this.comments;
    });

    this.totalSub = this.appDataService.totalComments
    .subscribe(comments=>{
      this.totalsC = comments;
      this.commentsC = this.totalsC;
      //console.log(comments);
    });

    this.questionsSub = this.appDataService.questions.subscribe(questions=>{
      this.questions = questions;
      this.questionsQ = this.questions;
    });

    this.loadingSub = this.appDataService.loadingEmitter.subscribe(loading=>{
      this.loading = loading;
      this.showProgress = this.loading;
    });

    from(Plugins.Storage.get({ key: 'recents' }))
    .pipe(
      map(fetchedData=>{
        if(!fetchedData || !fetchedData.value){
          this.no_recents = true;
          return null;
        }
        const data = JSON.parse(fetchedData.value) as Recents[];
        return data;
      })
    )
    .subscribe(data=>{
      this.recents = data;
      if(this.recents.length<1){
        this.no_recents = true;
      }
      for(let r of this.recents){
        if(r.hasOwnProperty('post')){
          this.recentsC.push(r);
        }else{
          this.recentsQ.push(r);
        }
      }
    });
  }

  search(event: any){
    //console.log(event.target.value);  
    this.showProgress = true;
    //this.commentsC = this.comments.filter(c=>c.comment.includes(event.target.value));
    this.commentsC = this.totalsC.filter(c=>c.comment.includes(event.target.value));
    this.questionsQ = this.questions.filter(q=>q.question.includes(event.target.value));
    if(this.questions.length>1 || this.totalsC.length>1){
      setTimeout(()=>{
        if(this.commentsC.length<1 || this.questionsQ.length<1){
          this.showProgress = false;
        }
      }, 50);
    }
    
  }

  delete(r: Recents){
    from(Plugins.Storage.get({ key: 'recents' }))
    .pipe(
      map(fetchedData=>{
        let data = JSON.parse(fetchedData.value) as Recents[];
        data = data.filter(d=>d.id!==r.id);
        Plugins.Storage.remove({ key: 'recents' });
        Plugins.Storage.set({ key: 'recents', value: JSON.stringify(data) });
        return data;
      }),
      tap(fetchedData=>{
        this.recents = fetchedData;
        this.recentsC = [];
        this.recentsQ = [];
        for(let r of this.recents){
          if(r.hasOwnProperty('post')){
            this.recentsC.push(r);
          }else{
            this.recentsQ.push(r);
          }
        }
      })
    )
    .subscribe(()=>{});
  }

  emitClick(){
    this.appDataService.clickEmitter.next(true);
  }

  storeC(id: string, recent_data: string, post_data: string){
    let recentData: Recents[] = [];
    from(Plugins.Storage.get({ key: 'recents' }))
    .pipe(
      switchMap(fetchedData=>{
        if(!fetchedData || !fetchedData.value){
          recentData.push({
            id: id,
            data: recent_data,
            post: post_data
          });

          Plugins.Storage.set({ key: 'recents', value: JSON.stringify(recentData) });
          return EMPTY;
        }else{
          const data = JSON.parse(fetchedData.value) as Recents[];
          for(let obj of data){
            if(obj.id===id){
              this.appDataService.clickEmitter.next(true);
              return EMPTY;
            }
          }
          data.push({
            id: id,
            data: recent_data,
            post: post_data
          });
          Plugins.Storage.remove({ key: 'recents' });
          Plugins.Storage.set({ key: 'recents', value: JSON.stringify(data) });
          return of(data);
        }

      })
    )
    .subscribe(()=>{
      this.appDataService.clickEmitter.next(true);
    });
  }

  store(id: string, recent_data: string){
    let recentData: Recents[] = [];
    from(Plugins.Storage.get({ key: 'recents' }))
    .pipe(
      switchMap(fetchedData=>{
        if(!fetchedData || !fetchedData.value){
          recentData.push({
            id: id,
            data: recent_data
          });

          Plugins.Storage.set({ key: 'recents', value: JSON.stringify(recentData) });
          return EMPTY;
        }else{
          const data = JSON.parse(fetchedData.value) as Recents[];
          for(let obj of data){
            if(obj.id===id){
              this.appDataService.clickEmitter.next(true);
              return EMPTY;
            }
          }
          data.push({
            id: id,
            data: recent_data
          });
          Plugins.Storage.remove({ key: 'recents' });
          Plugins.Storage.set({ key: 'recents', value: JSON.stringify(data) });
          return of(data);
        }

      })
    )
    .subscribe(()=>{
      this.appDataService.clickEmitter.next(true);
    });
  }

  clear(event: any){
    this.modalCtrl.dismiss(null, 'cancel');
  }

  ngOnDestroy(){
    if(this.questionsSub){
      this.questionsSub.unsubscribe();
    }
    if(this.commentsSub){
      this.commentsSub.unsubscribe();
    }
    if(this.totalSub){
      this.totalSub.unsubscribe();
    }

    if(this.loadingSub){
      this.loadingSub.unsubscribe();
    }
  }

}
