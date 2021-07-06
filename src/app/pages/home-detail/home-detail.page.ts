import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AlertController, IonContent, IonInfiniteScroll } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AppDataService } from 'src/app/services & shared/app-data.service';
import { AuthService } from 'src/app/services & shared/auth.service';
import { Question } from 'src/app/models/question.model';
import { SegmentChangeEventDetail } from '@ionic/core';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-home-detail',
  templateUrl: './home-detail.page.html',
  styleUrls: ['./home-detail.page.scss'],
})
export class HomeDetailPage implements OnInit, OnDestroy {
  loadedQuestions: Question[] = [];
  relevantQuestions: Question[] = [];
  questionsSub: Subscription;
  isLoading: boolean = false;
  alertChecked: boolean = false;
  aSub: Subscription;
  userSub: Subscription;
  //private activeLogoutTimer: any;
  stopScroll: boolean = false;
  segmentValue: string = 'recent';
  segLoading: boolean;
  isClicked: boolean = false;
  @ViewChild(IonContent) cont: IonContent;

  constructor(
    private appDataService: AppDataService,
    private alertCtrl: AlertController,
    private authService: AuthService
    ) {}

  ngOnInit() {
    this.questionsSub = this.appDataService.questions.subscribe(questions=>{
      if(questions){
        questions = [...new Map(questions.map(item => [item['id'], item])).values()];
        console.log(questions);
        questions.map(q=>{
          if(q.userImage){
            if(!q.userImage.startsWith('data:image/jpeg;base64,')){
              q.userImage = 'data:image/jpeg;base64,'+q.userImage;
            }
          }

          if(q.imageData){
            if(!q.imageData.startsWith('data:image/jpeg;base64,')){
              q.imageData = 'data:image/jpeg;base64,'+q.imageData;
            }
          }

        });
        this.loadedQuestions = questions;
        setTimeout(()=>{
          if(this.loadedQuestions.length<=3 && this.segmentValue==='recent'){
            this.relevantQuestions = this.loadedQuestions.sort((a, b)=>Number(new Date(b.postDate)) - Number(new Date(a.postDate)));
          }else{
            this.preLoading();
            //this.relevantQuestions = this.loadedQuestions;
          }
        }, 50);
      }

    });

    this.appDataService.stopScroll.subscribe(stopScroll=>{
      this.stopScroll = stopScroll;
    });

    this.appDataService.loadingEmitter.subscribe(loading=>{
      if(!loading){
        this.segLoading = false;
      }else{
        this.segLoading = true;
      }
    });

    this.appDataService.networkStatusRunTime.subscribe(status=>{
      if(!status){
        this.showAlert('Please check your network connection.');
      }else{
        window.location.reload();
      }
    });
  }

  ionViewWillEnter(){
    if(this.relevantQuestions){
      if(this.relevantQuestions.length>0){
        this.relevantQuestions = this.relevantQuestions.sort((a, b)=>Number(new Date(b.postDate)) - Number(new Date(a.postDate)));
      }
    }
    if(this.loadedQuestions.length<1){
      this.isLoading = true;
      this.appDataService.loadingEmitter.next(this.isLoading);
      this.aSub = this.authService.aToken.subscribe(aToken=>{
        if(aToken && this.loadedQuestions.length<1){
          this.appDataService.fetchQuestions(this.loadedQuestions.length).subscribe(()=>{
            this.isLoading = false;
            this.appDataService.loadingEmitter.next(this.isLoading);
          },
          err=>{
            this.isLoading = false;
            this.appDataService.loadingEmitter.next(this.isLoading);
            this.showAlert('Please check your network connection.');
          });
        }
      },
      err=>{
        this.showAlert('You are not authorized!');
      });

      this.userSub = this.authService.userIsAuthenticated.subscribe(auth=>{
        if(auth && this.loadedQuestions.length<1){
          this.appDataService.fetchQuestions(this.loadedQuestions.length).subscribe(()=>{
            this.isLoading = false;
            this.appDataService.loadingEmitter.next(this.isLoading);
          },
          err=>{
            this.isLoading = false;
            this.appDataService.loadingEmitter.next(this.isLoading);
            this.showAlert('Please check your network connection.');
          });
        }
      },
      err=>{
        this.showAlert('You are not authorized!');
      });
    }

  }

  selection(event){
    if(this.loadedQuestions.length>0){
      if(event.target.value==='recent'){
        this.segmentValue = event.target.value;
        this.relevantQuestions = this.loadedQuestions.sort((a, b)=>Number(new Date(b.postDate)) - Number(new Date(a.postDate)));
      }else if(event.target.value==='most'){
        this.segmentValue = event.target.value;
        this.relevantQuestions = this.loadedQuestions.sort((a, b)=>b.totalComments - a.totalComments);
      }else if(event.target.value==='answers'){
        this.segmentValue = event.target.value;
        this.relevantQuestions = this.loadedQuestions.sort((a, b)=>b.totalComments - a.totalComments);
      }else if(event.target.value==='mv'){
        this.segmentValue = event.target.value;
        this.relevantQuestions = this.loadedQuestions.sort((a, b)=>(b.downCount+b.upCount) - (a.downCount+a.upCount));
      }else{
        this.segmentValue = event.target.value;
        this.relevantQuestions = this.loadedQuestions.filter(q=>q.totalComments===0);
      }
    }
  }

  preLoading(){
    if(this.segmentValue==='recent'){
      this.relevantQuestions = this.loadedQuestions.sort((a, b)=>Number(new Date(b.postDate)) - Number(new Date(a.postDate)));
      const elmnt = document.getElementById('segment');
      const selection = document.getElementById('selection');
      if(elmnt || selection){
        elmnt.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
        selection.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
      }
    }else if(this.segmentValue==='most'){
      this.relevantQuestions = this.loadedQuestions.sort((a, b)=>b.totalComments - a.totalComments);
    }else if(this.segmentValue==='answers'){
      this.relevantQuestions = this.loadedQuestions.sort((a, b)=>b.totalComments - a.totalComments);
    }else if(this.segmentValue==='mv'){
      this.relevantQuestions = this.loadedQuestions.sort((a, b)=>(b.downCount+b.upCount) - (a.downCount+a.upCount));
    }else{
      this.relevantQuestions = this.loadedQuestions.filter(q=>q.totalComments===0);
    }
  }

  loadData(event){
    this.appDataService.fetchQuestions(this.loadedQuestions.length).subscribe(()=>{
      event.target.complete();
    });
  }

  setClick(){
    this.isClicked = true;
    this.loadDataMob();
  }

  loadDataMob(){
    this.appDataService.fetchQuestions(this.loadedQuestions.length).pipe(take(1)).subscribe(()=>{
      this.isClicked = false;
    });
  }

  onFilterUpdate(event: CustomEvent<SegmentChangeEventDetail>){
    if(this.loadedQuestions.length>0){
      if(event.detail.value==='recent'){
        this.segmentValue = event.detail.value;
        this.relevantQuestions = this.loadedQuestions.sort((a, b)=>Number(new Date(b.postDate)) - Number(new Date(a.postDate)));
      }else if(event.detail.value==='most'){
        this.segmentValue = event.detail.value;
        this.relevantQuestions = this.loadedQuestions.sort((a, b)=>b.totalComments - a.totalComments);
      }else if(event.detail.value==='answers'){
        this.segmentValue = event.detail.value;
        this.relevantQuestions = this.loadedQuestions.sort((a, b)=>b.totalComments - a.totalComments);
      }else if(event.detail.value==='mv'){
        this.segmentValue = event.detail.value;
        this.relevantQuestions = this.loadedQuestions.sort((a, b)=>(b.downCount+b.upCount) - (a.downCount+a.upCount));
      }else{
        this.segmentValue = event.detail.value;
        this.relevantQuestions = this.loadedQuestions.filter(q=>q.totalComments===0);
      }
    }
  }

  showAlert(message: string){
    this.alertCtrl
    .create({
      header: 'Error!',
      message: message,
      buttons: [{text: 'Okay', handler: ()=>{
        this.isLoading = false;
        this.appDataService.loadingEmitter.next(this.isLoading);
        if(this.loadedQuestions.length<1){
          this.alertChecked = true;
        }
      }}]
    })
    .then(alertEl => {
      alertEl.present();
    });
  }

  ngOnDestroy(){
    if(this.questionsSub){
      this.questionsSub.unsubscribe();
    }
    if(this.aSub){
      this.aSub.unsubscribe();
    }
    if(this.userSub){
      this.userSub.unsubscribe();
    }
  }

}
