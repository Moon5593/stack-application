import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AppDataService } from 'src/app/services & shared/app-data.service';
import { AuthService } from 'src/app/services & shared/auth.service';
import { Question } from 'src/app/models/question.model';

@Component({
  selector: 'app-home-detail',
  templateUrl: './home-detail.page.html',
  styleUrls: ['./home-detail.page.scss'],
})
export class HomeDetailPage implements OnInit, OnDestroy {
  loadedQuestions: Question[] = [];
  questionsSub: Subscription;
  isLoading: boolean = false;
  alertChecked: boolean = false;
  aSub: Subscription;
  userSub: Subscription;
  private activeLogoutTimer: any;

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
        if(aToken && this.loadedQuestions.length<1){
          this.appDataService.fetchQuestions().subscribe(()=>{
            this.isLoading = false;
            this.appDataService.loadingEmitter.next(this.isLoading);
          },
          err=>{
            setTimeout(() => {
              this.showAlert('You are not authorized!');
            }, 5000);
          });
        }
      },
      err=>{
        this.showAlert('Please check your network connection.');
      });
      if (this.activeLogoutTimer) {
        clearTimeout(this.activeLogoutTimer);
      }
      this.activeLogoutTimer = setTimeout(() => {
        if(this.loadedQuestions.length<1){
          this.showAlert('Please check your network connection.');
        }
      }, 30000);
      this.userSub = this.authService.userIsAuthenticated.subscribe(auth=>{
        if(auth && this.loadedQuestions.length<1){
          this.appDataService.fetchQuestions().subscribe(()=>{
            this.isLoading = false;
            this.appDataService.loadingEmitter.next(this.isLoading);
          },
          err=>{
            setTimeout(() => {
              this.showAlert('You are not authorized!');
            }, 5000);
          });
        }
      },
      err=>{
        this.showAlert('Please check your network connection.');
      });
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
        this.alertChecked = true;
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
