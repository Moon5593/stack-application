import { Component, DoCheck, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ModalController, NavController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AppDataService } from 'src/app/services & shared/app-data.service';
import { AuthService } from 'src/app/services & shared/auth.service';
import { Comment } from 'src/app/models/comment.model';
import { Question } from 'src/app/models/question.model';
import { ReportComponent } from '../../../modals/report/report.component';

@Component({
  selector: 'app-main-qa',
  templateUrl: './main-qa.page.html',
  styleUrls: ['./main-qa.page.scss'],
})
export class MainQaPage implements OnInit, OnDestroy, DoCheck {
  isLoading: boolean = false;
  isCommenting: boolean = false;
  question: Question;
  form: FormGroup;
  r_form: FormGroup;
  ror_form: FormGroup;
  comments: Comment[];
  username: string;
  commentsSub: Subscription;
  toHighlight: string;
  isinit: boolean = true;
  isClicked: boolean;
  clickSubject: Subscription;
  replies: string;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private authService: AuthService,
    private router: Router,
    private alertCtrl: AlertController,
    private appDataService: AppDataService,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.form = new FormGroup({
      image: new FormControl(null),
      details: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(1), Validators.maxLength(244)]
      })
    });

    this.commentsSub = this.appDataService.comments.subscribe(comments=>{
      comments.map((c, i)=>{
        if(!c.userImage.startsWith('data:image/jpeg;base64,')){
          c.userImage = 'data:image/jpeg;base64,'+c.userImage;
        }
        if(c.replies){
          for(let r of c.replies){
            if(!r.userImage.startsWith('data:image/jpeg;base64,')){
              r.userImage = 'data:image/jpeg;base64,'+r.userImage;
            }
            r.replyToReply = false;
          }
        }
        c.reply = false;
      });
      this.comments = comments;
      if(comments.length<1){
        this.replies = 'replies';
      }
    });

    this.clickSubject = this.appDataService.clickEmitter.subscribe(isClicked=>{
      this.isClicked = isClicked;
      this.modalCtrl.dismiss({}, 'confirm');
    });
    
  }

  ngDoCheck(){
    if(!this.isinit && this.isClicked){
      //this.toHighlight = this.route.snapshot.queryParams['toHighlight'];
      this.route.queryParams.subscribe(params=>{
        this.toHighlight = params['toHighlight'];
        console.log(this.toHighlight);
      if(this.toHighlight){
        this.scrollToReplies(this.toHighlight);
        this.isClicked = false;
      }
      });
    }
  }

  ionViewWillEnter(){
    this.loadingCtrl
      .create({ keyboardClose: true, message: 'Please wait...' })
      .then(loadingEl=>{
        loadingEl.present();
        this.route.paramMap.subscribe(paramMap=>{
          if(!paramMap.has('questionId')){
            loadingEl.dismiss();
            this.navCtrl.navigateBack('/app/home');
            return;
          }
          this.isLoading = true;
          this.authService.userName.pipe(
            take(1),
            switchMap(userName=>{
              this.username = userName;
              return this.appDataService.getQuestion(paramMap.get('questionId'));
            }),
            take(1),
            switchMap(question=>{
              this.question = question;
              return this.appDataService.fetchComments(question.id);
            }))
          .subscribe(()=>{
            loadingEl.dismiss();
            //console.log(question);
            this.isLoading  = false;
            setTimeout(()=>{
              this.toHighlight = this.route.snapshot.queryParams['toHighlight'];
              if(this.toHighlight){
                this.scrollToReplies(this.toHighlight);
                this.isinit = false;
              }
            }, 1000);
            
          },
          error=>{
            this.modalCtrl.dismiss({}, 'confirm');
            loadingEl.dismiss();
            this.alertCtrl.create({
              header: 'An error occurred!',
              message: 'Could not load a question.',
              buttons: [{text: 'Okay', handler: ()=>{
                this.router.navigate(['/app/home']);
              }}]
            })
            .then(alertEl=>{
              alertEl.present();
            });
          });
        });
      });

  }

  scrollToReplies(scrollTo: string){
    const elmnt = document.getElementById(scrollTo);
      //console.log(elmnt, scrollTo);
      if(elmnt){
        elmnt.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
      } 
  }

  report(){
    this.modalCtrl.create({component: ReportComponent}).then(modalEl=>{
      modalEl.present();
      return modalEl.onDidDismiss();
    }).then(resultData=>{
      if(resultData.role === 'confirm'){
        //console.log(resultData.data.report.details);
      }
    });
  }

  onComment(){
    if(!this.form.valid){
      return;
    }
    this.authService.userIsAuthenticated.pipe(take(1)).subscribe(auth=>{
      if(auth){
        this.isCommenting = true;
        this.appDataService.createComment(this.question.id, this.form.value.details, new Date()).subscribe(comments=>{
          this.isCommenting = false;
          this.form.reset();
        }, err=>{
          this.isCommenting = false;
          this.showAlert('Could not post a comment.');
        });
      }else{
        this.toastCtrl.create({message: 'You need to login or signup first before you can start commenting. :-)', duration: 2000})
        .then(toastEl=>{
          toastEl.present();
        });
      }
    });

  }

  showAlert(message: string){
    this.alertCtrl.create({
      header: 'An error occurred!',
      message: message,
      buttons: [{text: 'Okay', handler: ()=>{
        this.isCommenting = false;
      }}]
    })
    .then(alertEl=>{
      alertEl.present();
    });
  }

  setReplyStatus(index: number){
    this.authService.userIsAuthenticated.pipe(take(1)).subscribe(auth=>{
      if(auth){
        this.comments[index].reply = !this.comments[index].reply;
        this.r_form = new FormGroup({
          r_details: new FormControl(null, {
            validators: [Validators.required, Validators.minLength(1), Validators.maxLength(244)]
          })
        });
      }else{
        this.toastCtrl.create({message: 'You need to login or signup first before you can start replying to comments/posts. :-)', duration: 2000})
        .then(toastEl=>{
          toastEl.present();
        });
      }
    });
  }

  setReplyToReplyStatus(index: number, replyIndex: number){
    this.authService.userIsAuthenticated.pipe(take(1)).subscribe(auth=>{
      if(auth){
        this.comments[index].replies[replyIndex].replyToReply = !this.comments[index].replies[replyIndex].replyToReply;
        this.ror_form = new FormGroup({
          ror_details: new FormControl(null, {
            validators: [Validators.required, Validators.minLength(1), Validators.maxLength(244)]
          })
        });
      }else{
        this.toastCtrl.create({message: 'You need to login or signup first before you can start replying to comments/posts. :-)', duration: 2000})
        .then(toastEl=>{
          toastEl.present();
        });
      }
    });
  }

  onReplyToReply(commentId: string, repliedToId: string, index: number, replyIndex: number){
    if(!this.ror_form.valid){
      return;
    }
    console.log(this.ror_form.value.ror_details);
    this.authService.userIsAuthenticated.pipe(take(1)).subscribe(auth=>{
      if(auth){
        this.isCommenting = true;
        this.appDataService.createReplyToReply(commentId, repliedToId, this.ror_form.value.ror_details, new Date(), index, replyIndex).subscribe(replies=>{
          this.isCommenting = false;
          this.comments[index].replies[replyIndex].replyToReply = false;
          this.ror_form.reset();
        }, err=>{
          this.isCommenting = false;
          this.showAlert('Could not post a comment.');
        });
      }else{
        this.toastCtrl.create({message: 'You need to login or signup first before you can start commenting. :-)', duration: 2000})
        .then(toastEl=>{
          toastEl.present();
        });
      }
    });
  }

  onReply(commentId: string, index: number){
    if(!this.r_form.valid){
      return;
    }
    console.log(this.r_form.value.r_details);
    this.authService.userIsAuthenticated.pipe(take(1)).subscribe(auth=>{
      if(auth){
        this.isCommenting = true;
        this.appDataService.createReply(commentId, this.r_form.value.r_details, new Date(), index).subscribe(replies=>{
          this.isCommenting = false;
          this.comments[index].reply = false;
          this.r_form.reset();
        }, err=>{
          this.isCommenting = false;
          this.showAlert('Could not post a comment.');
        });
      }else{
        this.toastCtrl.create({message: 'You need to login or signup first before you can start commenting. :-)', duration: 2000})
        .then(toastEl=>{
          toastEl.present();
        });
      }
    });
  }

  ngOnDestroy(){
    if(this.commentsSub){
      this.commentsSub.unsubscribe();
    }
    if(this.clickSubject){
      this.clickSubject.unsubscribe();
    }
  }

}
