import { Component, OnDestroy, OnInit} from '@angular/core';
import { Router,NavigationStart, Event as NavigationEvent } from '@angular/router';
//import {Plugins, Capacitor} from '@capacitor/core';
import { Config, createAnimation, LoadingController, ModalController, Platform, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppDataService } from '../../services & shared/app-data.service';
import { AuthService } from '../../services & shared/auth.service';
import { QuestionComponent } from '../../modals/question/question.component';
import { SegmentChangeEventDetail } from '@ionic/core';
import { Question } from 'src/app/models/question.model';
import { Users } from 'src/app/models/users.model';

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
  switch: boolean = false;
  totalQues: number = 0;
  totalAns: number = 0;
  totalBest: number = 0;
  totalUsers: number = 0;
  segLoading: boolean;
  topComments: Subscription;
  ques: Question[];
  topThreeUsers: Users[];

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
          this.url = event.url;
        }
      });

      this.appData.totalListQues.subscribe(ques=>{
        if(ques){
          if(ques.length>1){
            ques = [...new Map(ques.map(item => [item, item])).values()];
          }
          this.totalQues = ques.length;
        }
      });
      this.appData.totalListAns.subscribe(ans=>{
        this.totalAns = ans.length;
      });
      this.appData.bestAns.subscribe(best=>{
        this.totalBest = best;
      });
      this.authService.totalUsers.subscribe(users=>{
        this.totalUsers = users.length;
      });

      this.appData.loadingEmitter.subscribe(loading=>{
        if(!loading){
          this.segLoading = false;
        }else{
          this.segLoading = true;
        }
      });

      this.appData.questions.subscribe(ques=>{
        this.ques = ques;
      });

      this.authService.topThreeUsers.subscribe(users=>{
        users.map(u=>{
          if(u.imageUrl){
            if(!u.imageUrl.startsWith('data:image/jpeg;base64,')){
              u.imageUrl = 'data:image/jpeg;base64,'+u.imageUrl;
            }
          }
        });
        this.topThreeUsers = users;
      });
  }

  ionViewWillEnter(){
    this.url = this.router.url;
  }

  onAskQuestion(){
    this.authService.userIsAuthenticated.pipe(take(1)).subscribe(auth=>{
      if(auth){
        this.modalCtrl.create({component: QuestionComponent}).then(modalEl=>{
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

  onFilterUpdate(event: CustomEvent<SegmentChangeEventDetail>){
    if(event.detail.value === 'answers'){
      this.switch = true;
      this.topComments = this.appData.fetchTopComments().pipe(take(1)).subscribe(next=>{
        this.appData.cLoadingEmitter.next(false);
        setTimeout(async ()=>{
          await createAnimation()
          .addElement(document.querySelector('app-answer div.ans'))
          .delay(250)
          .keyframes([
            { offset: 0, opacity: '0', transform: 'translateY(100%)' },
            { offset: 1, opacity: '0.99', transform: 'translateY(0)' }
          ])
          .duration(250)
          .play();
        }, 50);
      },
      err=>{
        this.appData.cLoadingEmitter.next(false);
      });
    }else{
      this.switch = false;
      if(this.topComments){
        this.topComments.unsubscribe();
      }
    }
  }

  ngOnDestroy(){
    this.urlSubs.unsubscribe();
    if(this.topComments){
      this.topComments.unsubscribe();
    }
  }

}
