import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { AppDataService } from 'src/app/services & shared/app-data.service';
import { AuthService } from 'src/app/services & shared/auth.service';
import { Question } from 'src/app/models/question.model';

@Component({
  selector: 'app-question-card',
  templateUrl: './question-card.page.html',
  styleUrls: ['./question-card.page.scss'],
})
export class QuestionCardPage implements OnInit {
  @Input() loadedQuestions: Question[];
  isLoading: boolean = false;
  currentIndex: number;

  constructor(
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private appDataService: AppDataService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private authService: AuthService
    ) {}

  ngOnInit() {}

  qaPage(id: string){
    this.navCtrl.navigateForward([id], {animated: true, animationDirection: 'forward', relativeTo: this.route});
  }

  increaseCount(id: string, i: number){
    this.authService.userIsAuthenticated.subscribe(auth=>{
      if(auth){
        this.isLoading  = true;
        this.currentIndex = i;
        this.appDataService.upvote(id).subscribe(()=>{
          this.isLoading = false;
        },
        err=>{
          this.showAlert('Failed to upvote');
        });
      }else{
        this.isLoading = false;
        this.toastCtrl.create({message: 'You need to login or signup first before you can start voting. :-)', duration: 2000})
        .then(toastEl=>{
          toastEl.present();
        });
      }
    });
    
  }

  showAlert(message: string){
    this.alertCtrl
      .create({
      header: 'Please check your network connection.',
      message: message,
      buttons: [{text: 'Okay', handler: ()=>{
        this.isLoading = false;
        }}]
      })
      .then(alertEl => {
      alertEl.present();
    });
  }

  decreaseCount(id: string, i: number){
    this.authService.userIsAuthenticated.subscribe(auth=>{
      if(auth){
        this.isLoading  = true;
        this.currentIndex = i;
        this.appDataService.downvote(id).subscribe(()=>{
          this.isLoading = false;
        },
        err=>{
          this.showAlert('Failed to downvote');
        });
      }else{
        this.isLoading = false;
        this.toastCtrl.create({message: 'You need to login or signup first before you can start voting. :-)', duration: 2000})
        .then(toastEl=>{
          toastEl.present();
        });
      }
    });
  }

}
