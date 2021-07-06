import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Users } from 'src/app/models/users.model';
import { AppDataService } from 'src/app/services & shared/app-data.service';
import { AuthService } from 'src/app/services & shared/auth.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
})
export class UsersPage implements OnInit, OnDestroy {
  loadedUsers: Users[] = [];
  usersSub: Subscription;
  isLoading: boolean = false;
  alertChecked: boolean = false;
  aSub: Subscription;
  userSub: Subscription;
  stopScroll: boolean = false;
  networkStatus: Subscription;
  quesSub: Subscription;

  constructor(
    private appDataService: AppDataService,
    private alertCtrl: AlertController,
    private authService: AuthService
    ) {}

  ngOnInit() {
    this.usersSub = this.authService.allUsers.subscribe(users=>{
      console.log(users);
      users.map(u=>{
        if(u.imageUrl){
          if(!u.imageUrl.startsWith('data:image/jpeg;base64,')){
            u.imageUrl = 'data:image/jpeg;base64,'+u.imageUrl;
          }
        }
      });
      this.loadedUsers = users;
    });

    this.authService.stopScroll.subscribe(stopScroll=>{
      this.stopScroll = stopScroll;
    });

    this.networkStatus = this.appDataService.networkStatusRunTime.subscribe(status=>{
      if(!status){
        this.showAlert('Please check your network connection.');
      }else{
        window.location.reload();
      }
    });
  }

  ionViewWillEnter(){
    if(this.loadedUsers.length<1){
      this.isLoading = true;
      this.appDataService.loadingEmitter.next(this.isLoading);
      this.aSub = this.authService.aToken.subscribe(aToken=>{
        if(aToken && this.loadedUsers.length<1){
          this.authService.fetchUsers(this.loadedUsers.length).subscribe(()=>{
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
        if(auth && this.loadedUsers.length<1){
          this.authService.fetchUsers(this.loadedUsers.length).subscribe(()=>{
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

  loadData(event){
    this.authService.fetchUsers(this.loadedUsers.length).subscribe(()=>{
      event.target.complete();
    });
  }

  showAlert(message: string){
    this.alertCtrl
    .create({
      header: 'Error!',
      message: message,
      buttons: [{text: 'Okay', handler: ()=>{
        this.isLoading = false;
        this.appDataService.loadingEmitter.next(this.isLoading);
        if(this.loadedUsers.length<1){
          this.alertChecked = true;
        }
      }}]
    })
    .then(alertEl => {
      alertEl.present();
    });
  }

  ngOnDestroy(){
    if(this.usersSub){
      this.usersSub.unsubscribe();
    }
    if(this.aSub){
      this.aSub.unsubscribe();
    }
    if(this.userSub){
      this.userSub.unsubscribe();
    }
    if(this.networkStatus){
      this.networkStatus.unsubscribe();
    }
  }

}
