import { Component, DoCheck, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ModalController, NavController, ToastController } from '@ionic/angular';
import { of, Subject, Subscription } from 'rxjs';
import { delay, distinctUntilChanged, first, repeatWhen, skip, skipUntil, startWith, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { AppDataService } from 'src/app/services & shared/app-data.service';
import { AuthService } from 'src/app/services & shared/auth.service';
import { Comment } from 'src/app/models/comment.model';
import { Question } from 'src/app/models/question.model';
import { ReportComponent } from '../../../modals/report/report.component';

function base64toBlob(base64Data, contentType) {
  contentType = contentType || '';
  const sliceSize = 1024;
  const byteCharacters = window.atob(base64Data);
  const bytesLength = byteCharacters.length;
  const slicesCount = Math.ceil(bytesLength / sliceSize);
  const byteArrays = new Array(slicesCount);

  for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    const begin = sliceIndex * sliceSize;
    const end = Math.min(begin + sliceSize, bytesLength);

    const bytes = new Array(end - begin);
    for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0);
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes);
  }
  return new Blob(byteArrays, { type: contentType });
}

@Component({
  selector: 'app-main-qa',
  templateUrl: './main-qa.page.html',
  styleUrls: ['./main-qa.page.scss'],
})
export class MainQaPage implements OnInit, OnDestroy, DoCheck {
  isLoading: boolean = false;
  isVoteLoading: boolean = false;
  isVoteLoadingC: boolean = false;
  isVoteLoadingR: boolean = false;
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
  image: string;
  currentIndex: number;
  currentReplyIndex: number;
  qSub: Subscription;
  pollForm: FormGroup;
  checkStatus: boolean;
  valid: boolean = false;
  pollSub: Subscription;
  index: number;
  checker = new Subject<number>();
  tSub: Subscription;

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

    this.pollForm = new FormGroup({
      checks_array: new FormArray([new FormGroup({
        check: new FormControl(false)
      })], this.selectCheckStatus.bind(this)
      )
    });

    this.commentsSub = this.appDataService.comments.subscribe(comments=>{
      if(comments){
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
      }
    });
    this.qSub = this.appDataService.questions.subscribe(ques=>{
      if(ques && this.question){
        const questionIndex = ques.findIndex(q=>q.id===this.question.id);
        this.question = ques[questionIndex];
      }
    });

    this.clickSubject = this.appDataService.clickEmitter.subscribe(isClicked=>{
      this.isClicked = isClicked;
      this.modalCtrl.dismiss({}, 'confirm');
    });

    this.tSub = this.appDataService.tQuestions.subscribe(t=>{
      if(t){
        if(!this.isinit){
          if(t.length<1){
            this.appDataService.loadingEmitter.next(true);
          }else{
            this.appDataService.loadingEmitter.next(false);
          }
        }
      }
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

    this.checker.pipe(take(1)).subscribe(val=>{
      this.index = val;
      //console.log(this.index);
    });

    this.pollSub = this.pollForm.valueChanges.pipe(startWith(this.pollForm.value), distinctUntilChanged()).subscribe(()=>{
      if(this.index>=0){
        (<FormArray>this.pollForm.get('checks_array')).controls[this.index].setValue({check: true}, {emitEvent: false});
        for(let y = 0; y < (<FormArray>this.pollForm.get('checks_array')).controls.length; y++){
          if(y!==this.index){
            (<FormArray>this.pollForm.get('checks_array')).controls[y].setValue({check: false}, {emitEvent: false});
          }
        }
      }
    });
  }

  ionViewWillEnter(){
    this.index = -1;
    this.loadingCtrl
      .create({ keyboardClose: true, message: 'Please wait...' })
      .then(loadingEl=>{
        loadingEl.present();
        this.route.paramMap.pipe(take(1)).subscribe(paramMap=>{
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
              console.log(this.question);
              if(this.question.add_answers){
                if(this.question.add_answers.length>1){
                  this.onAddCheck();
                  if(!this.question.add_answers[0]['answer']){
                    for(let a = 0; a<this.question.add_answers.length; a++){
                      if(!this.question.add_answers[a].startsWith('data:image/jpeg;base64,')){
                        this.question.add_answers[a] = 'data:image/jpeg;base64,'+this.question.add_answers[a];
                      }
                    }
                  }
                }
              }
              if(this.question.userImage){
                if(!this.question.userImage.startsWith('data:image/jpeg;base64,')){
                  this.question.userImage = 'data:image/jpeg;base64,'+this.question.userImage;
                }
              }

              if(this.question.imageData){
                if(!this.question.imageData.startsWith('data:image/jpeg;base64,')){
                  this.question.imageData = 'data:image/jpeg;base64,'+this.question.imageData;
                }
              }
              return this.appDataService.fetchComments(question.id);
            })
            )
          .subscribe(()=>{
            loadingEl.dismiss();
            //console.log(question);
            this.isLoading = false;
            setTimeout(()=>{
              this.toHighlight = this.route.snapshot.queryParams['toHighlight'];
              if(this.toHighlight){
                this.scrollToReplies(this.toHighlight);
                this.isinit = false;
              }
            }, 1000);
          },
          error=>{
            console.log(error);
            //this.modalCtrl.dismiss({}, 'confirm');
            loadingEl.dismiss();
            this.alertCtrl.create({
              header: 'An error occurred!',
              message: 'Could not load a question.',
              buttons: [{text: 'Okay', handler: ()=>{
                //this.router.navigate(['/app/home']);
              }}]
            })
            .then(alertEl=>{
              alertEl.present();
            });
          });
        });
      });

  }

  onAddCheck(){
    (<FormArray>this.pollForm.get('checks_array')).clear();
    for(let i = 0; i < this.question.add_answers.length; i++){
      if(this.question.add_answers[i]){
        (<FormArray>this.pollForm.get('checks_array')).push(
          new FormGroup({
            'check': new FormControl(false)
          })
        );
      }
    }
    //(<FormArray>this.pollForm.get('checks_array')).removeAt(0);
  }

  get controls() {
    //console.log((<FormArray>this.form.get('add_answers')).controls.length);
    return (<FormArray>this.pollForm.get('checks_array')).controls;
  }

  selectCheckStatus(fa: FormArray): {[s: string]: boolean} {
    for (let x = 0; x < fa.length; x++) {
      if (fa.at(x).value['check']===true) {
        this.valid = true;
        break;
      }
    }

    return this.valid ? null : {
      'multipleCheckboxRequireOne': true
    };
  }

  check(event, i: number){
    console.log(event);
    this.checker.next(i);
  }

  postResult(){
    console.log(this.pollForm);
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

  increaseCount(id: string){
    this.authService.userIsAuthenticated.pipe(take(1)).subscribe(auth=>{
      if(auth){
        this.isVoteLoading  = true;
        this.appDataService.upvote(id).subscribe(()=>{
          this.isVoteLoading = false;
        },
        err=>{
          this.showAlert('Failed to upvote');
        });
      }else{
        this.isVoteLoading = false;
        this.toastCtrl.create({message: 'You need to login or signup first before you can start voting. :-)', duration: 2000})
        .then(toastEl=>{
          toastEl.present();
        });
      }
    });

  }

  decreaseCount(id: string){
    this.authService.userIsAuthenticated.pipe(take(1)).subscribe(auth=>{
      if(auth){
        this.isVoteLoading  = true;
        this.appDataService.downvote(id).subscribe(()=>{
          this.isVoteLoading = false;
        },
        err=>{
          this.showAlert('Failed to downvote');
        });
      }else{
        this.isVoteLoading = false;
        this.toastCtrl.create({message: 'You need to login or signup first before you can start voting. :-)', duration: 2000})
        .then(toastEl=>{
          toastEl.present();
        });
      }
    });
  }

  upvoteComment(id: string, i: number){
    this.authService.userIsAuthenticated.pipe(take(1)).subscribe(auth=>{
      if(auth){
        this.isVoteLoadingC  = true;
        this.currentIndex = i;
        this.appDataService.upvoteComment(id).subscribe(()=>{
          this.isVoteLoadingC = false;
        },
        err=>{
          this.showAlert('Failed to upvote');
        });
      }else{
        this.isVoteLoadingC = false;
        this.toastCtrl.create({message: 'You need to login or signup first before you can start voting. :-)', duration: 2000})
        .then(toastEl=>{
          toastEl.present();
        });
      }
    });
  }

  downvoteComment(id: string, i: number){
    this.authService.userIsAuthenticated.pipe(take(1)).subscribe(auth=>{
      if(auth){
        this.isVoteLoadingC  = true;
        this.currentIndex = i;
        this.appDataService.downvoteComment(id).subscribe(()=>{
          this.isVoteLoadingC = false;
        },
        err=>{
          this.showAlert('Failed to downvote');
        });
      }else{
        this.isVoteLoadingC = false;
        this.toastCtrl.create({message: 'You need to login or signup first before you can start voting. :-)', duration: 2000})
        .then(toastEl=>{
          toastEl.present();
        });
      }
    });
  }

  upvoteReply(commentId: string, replyId: string, i: number, r: number){
    this.authService.userIsAuthenticated.pipe(take(1)).subscribe(auth=>{
      if(auth){
        this.isVoteLoadingR  = true;
        this.currentIndex = i;
        this.currentReplyIndex = r;
        this.appDataService.upvoteReply(commentId, replyId).subscribe(()=>{
          this.isVoteLoadingR = false;
        },
        err=>{
          this.showAlert('Failed to upvote');
        });
      }else{
        this.isVoteLoadingR = false;
        this.toastCtrl.create({message: 'You need to login or signup first before you can start voting. :-)', duration: 2000})
        .then(toastEl=>{
          toastEl.present();
        });
      }
    });
  }

  downvoteReply(commentId: string, replyId: string, i: number, r: number){
    this.authService.userIsAuthenticated.pipe(take(1)).subscribe(auth=>{
      if(auth){
        this.isVoteLoadingR  = true;
        this.currentIndex = i;
        this.currentReplyIndex = r;
        this.appDataService.downvoteReply(commentId, replyId).subscribe(()=>{
          this.isVoteLoadingR = false;
        },
        err=>{
          this.showAlert('Failed to downvote');
        });
      }else{
        this.isVoteLoadingR = false;
        this.toastCtrl.create({message: 'You need to login or signup first before you can start voting. :-)', duration: 2000})
        .then(toastEl=>{
          toastEl.present();
        });
      }
    });
  }

  onImagePicked(imageData: string | File) {
    let imageFile;
    if (typeof imageData === 'string') {
      this.image = imageData;
      try {
        imageFile = base64toBlob(
          imageData.replace('data:image/jpeg;base64,', ''),
          'image/jpeg'
        );
      } catch (error) {
        console.log(error);
        return;
      }
    } else {
      const fr = new FileReader();
      fr.onload = () => {
        let dataUrl = fr.result.toString();
        //console.log(dataUrl);
        dataUrl = dataUrl.replace('data:image/jpeg;base64,', '');
        this.image =  dataUrl;
      };
      fr.readAsDataURL(imageData);

      imageFile = imageData;
    }
    this.form.patchValue({ image: imageFile });
  }

  ngOnDestroy(){
    if(this.commentsSub){
      this.commentsSub.unsubscribe();
    }
    if(this.clickSubject){
      this.clickSubject.unsubscribe();
    }
    if(this.qSub){
      this.qSub.unsubscribe();
    }
    if(this.pollSub){
      this.pollSub.unsubscribe();
    }
    if(this.tSub){
      this.tSub.unsubscribe();
    }
  }

}
