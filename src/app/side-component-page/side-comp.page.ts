import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router,NavigationStart, Event as NavigationEvent } from '@angular/router';
//import {Plugins, Capacitor} from '@capacitor/core';
import { Config, LoadingController, ModalController, Platform, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppDataService } from '../app-data.service';
import { AuthService } from '../auth/auth.service';
import { QuestionModalComponent } from '../pages/question-modal/question-modal.component';

@Component({
  selector: 'app-side-comp',
  templateUrl: './side-comp.page.html',
  styleUrls: ['./side-comp.page.scss']
})
export class SideCompPage implements OnInit, OnDestroy {
  dark:boolean = false;
  ios: boolean;
  url: string = '/app/home';
  urlSubs: Subscription;

  constructor(
      private platform: Platform,
      private config: Config,
      private router: Router,
      private modalCtrl: ModalController,
      private appData: AppDataService,
      private toastCtrl: ToastController,
      private loadingCtrl: LoadingController,
      private authService: AuthService
    ) {}

  ngOnInit() {
    this.ios = this.config.get('mode') === 'ios';
    //this.url = this.router.url;
    this.urlSubs = this.router.events
    .subscribe(
      (event: NavigationEvent) => {
        if(event instanceof NavigationStart) {
          console.log(event.url);
          this.url = event.url;
        }
      });
  }

  ionViewWillEnter(){
    this.url = this.router.url;
  }

  onAskQuestion(){
    this.authService.userIsAuthenticated.pipe(take(1)).subscribe(auth=>{
      if(auth){
        this.modalCtrl.create({component: QuestionModalComponent}).then(modalEl=>{
          modalEl.present();
          return modalEl.onDidDismiss();
        }).then(resultData=>{
          console.log(resultData.data, resultData.role);
          if(resultData.role === 'confirm'){
            this.loadingCtrl.create({message: 'Posting Question...'})
            .then(loadingEl=>{
              loadingEl.present();
              this.appData.postQuestion(
                resultData.data.postingData.question,
                resultData.data.postingData.catagory,
                resultData.data.postingData.tags,
                resultData.data.postingData.add_answers,
                resultData.data.postingData.image,
                resultData.data.postingData.details,
                resultData.data.postingData.current_date,
                resultData.data.postingData.anonymous,
                resultData.data.postingData.private_question,
                resultData.data.postingData.notif,
                resultData.data.postingData.policy
              )
              .subscribe(response=>{
                console.log(response);
                loadingEl.dismiss();
                this.toastCtrl.create({message: 'Successfully posted your post.', duration: 2000})
                .then(toastEl=>{
                  toastEl.present();
                });
              },
              errRes=>{
                loadingEl.dismiss();
                this.toastCtrl.create({message: 'Failed to post.!', duration: 2000})
                .then(toastEl=>{
                  toastEl.present();
                });
              });
            });
          }

        });
      }else{
        this.toastCtrl.create({message: 'You need to login or signup first before you can start posting. :-)', duration: 2000})
        .then(toastEl=>{
          toastEl.present();
        });
      }
    });
  }

  ngOnDestroy(){
    this.urlSubs.unsubscribe();
  }

}
