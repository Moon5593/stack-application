import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppDataService } from 'src/app/app-data.service';
import { AuthService } from 'src/app/auth/auth.service';
import { Question } from 'src/app/question.model';

@Component({
  selector: 'app-home-page-detail',
  templateUrl: './home-page-detail.page.html',
  styleUrls: ['./home-page-detail.page.scss'],
})
export class HomePageDetailPage implements OnInit, OnDestroy {
  loadedQuestions: Question[];
  questionsSub: Subscription;
  isLoading: boolean = false;
  alertChecked: boolean = false;
  aSub: Subscription;
  userSub: Subscription;

  constructor(private appDataService: AppDataService, private alertCtrl: AlertController, private authService: AuthService) {}

  ngOnInit() {
    this.questionsSub = this.appDataService.questions.subscribe(questions=>{
      console.log(questions);
      questions.map(q=>{
        if(!q.userImage.startsWith('data:image/jpeg;base64,')){
          q.userImage = 'data:image/jpeg;base64,'+q.userImage;
        }
        if(q.imageData){
          if(!q.imageData.startsWith('data:image/jpeg;base64,')){
            q.imageData = 'data:image/jpeg;base64,'+q.imageData;
          }
        }
        
      });
      this.loadedQuestions = questions;
    });
  }

  ionViewWillEnter(){
    if(this.loadedQuestions.length<1){
      this.isLoading = true;
      this.appDataService.loadingEmitter.next(this.isLoading);
      this.aSub = this.authService.aToken.subscribe(aToken=>{
        if(aToken){
          console.log('inside anonymous home page');
          this.appDataService.fetchQuestions().subscribe(()=>{
            this.isLoading = false;
            this.appDataService.loadingEmitter.next(this.isLoading);
          },
          err=>{
            this.alertCtrl
            .create({
              header: 'Error!',
              message: 'Please check your network connection.',
              buttons: [{text: 'Okay', handler: ()=>{
                this.isLoading = false;
                this.appDataService.loadingEmitter.next(this.isLoading);
                this.alertChecked = true;
              }}]
            })
            .then(alertEl => {
              alertEl.present();
            });
          });
        }
      });

      this.userSub = this.authService.userIsAuthenticated.subscribe(auth=>{
        if(auth){
          console.log('inside user home page');
          this.appDataService.fetchQuestions().subscribe(()=>{
            this.isLoading = false;
            this.appDataService.loadingEmitter.next(this.isLoading);
          },
          err=>{
            this.alertCtrl
            .create({
              header: 'Error!',
              message: 'Please check your network connection.',
              buttons: [{text: 'Okay', handler: ()=>{
                this.isLoading = false;
                this.appDataService.loadingEmitter.next(this.isLoading);
                this.alertChecked = true;
              }}]
            })
            .then(alertEl => {
              alertEl.present();
            });
          });
        }
      });
    }
    
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
