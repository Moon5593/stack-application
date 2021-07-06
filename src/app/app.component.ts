import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { from, of, Subscription, EMPTY, Subject } from 'rxjs';
import { AuthService } from './services & shared/auth.service';
import { AppDataService } from './services & shared/app-data.service';
import { AppState, Plugins, NetworkStatus, PluginListenerHandle } from '@capacitor/core';
import { filter, switchMap, take, tap } from 'rxjs/operators';
import { AlertController } from '@ionic/angular';
const { Network } = Plugins;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  dark = false;
  private authSub: Subscription;
  public previousAuthState = false;
  userImage: string;
  urlImage: string;
  anonymous_sub: Subscription;
  innerSub: Subscription;
  networkStatus: NetworkStatus;
  networkListener: PluginListenerHandle;

  sidelist_items = [
    {
      title: 'Home',
      url: '/app/home',
      icon: 'home-outline'
    },
    {
      title: 'Users',
      url: '/app/users',
      icon: 'person-outline'
    },
    {
      title: 'VIP Page',
      url: '/app/vip',
      icon: 'pricetag-outline'
    },
    {
      title: 'Badges',
      url: '/app/badges',
      icon: 'diamond-outline'
    },
    {
      title: 'Help',
      url: '/app/help',
      icon: 'help-buoy-outline'
    }
  ];

  constructor(
      private appData: AppDataService,
      private authService: AuthService
    ) {}

  async ngOnInit(){
    this.networkListener = Network.addListener('networkStatusChange', (status) => {
      console.log("Network status changed", status);
      this.networkStatus = status;
      this.appData.networkStatusRunTime.next(this.networkStatus.connected);
    });

    this.networkStatus = await Network.getStatus();

    this.authSub = this.authService.userIsAuthenticated.subscribe(isAuth => {
      if (!isAuth && this.previousAuthState !== isAuth) {}
      this.previousAuthState = isAuth;
      this.authService.userImage.pipe(take(1)).subscribe(image=>{
        this.urlImage = image;
        this.userImage = 'data:image/jpeg;base64,' + image;
      });
    });

    if(!this.previousAuthState){
      this.anonymous_sub = from(Plugins.Storage.get({ key: 'authData' }))
      .pipe(
        switchMap(fetchedUser=>{
          if(!fetchedUser || !fetchedUser.value){
            return from(Plugins.Storage.get({ key: 'anonymousToken' }));
          }else{
            const parsedData = JSON.parse(fetchedUser.value) as {
              token: string;
              tokenExpirationDate: string;
              userId: string;
              email: string;
              name: string,
              badge: string,
              imageUrl: string,
              rep_points: number
            };
            if(parsedData){
              const expirationTime = new Date(parsedData.tokenExpirationDate);
              if(expirationTime <= new Date()){
                Plugins.Storage.remove({ key: 'authData' });
                return from(Plugins.Storage.get({ key: 'anonymousToken' }));
              }
            }
            this.innerSub = this.authService.userIsAuthenticated
            .subscribe(auth=>{
              if(auth){
                this.fetchUsers();
                this.fetchAnswers();
                this.fetchTopUsers();
                this.fetchTopQuestions();
              }
              if(this.innerSub){
                this.innerSub.unsubscribe();
              }
            });
            return EMPTY;
          }
        }),
        switchMap(fetchedData=>{
          const data = JSON.parse(fetchedData.value) as {
            token: string;
            expiresIn: string;
          };
          if(data){
            const expirationTime = new Date(data.expiresIn);
            if(expirationTime <= new Date()){
              Plugins.Storage.remove({ key: 'anonymousToken' });
              fetchedData = null;
            }
          }
          if (!fetchedData || !fetchedData.value){
            this.authService.anonymousSignUp()
            .pipe(
              tap(tokenData=>{
              const expirationTime = new Date(
                new Date().getTime() + +tokenData.expiresIn * 1000
              ).toISOString();
              const data = JSON.stringify({
                token: tokenData.idToken,
                expiresIn: expirationTime
              });
              Plugins.Storage.set({ key: 'anonymousToken', value: data });
              this.authService._atoken.next(tokenData.idToken);
              })
            )
            .subscribe(()=>{
              this.fetchUsers();
              this.fetchAnswers();
              this.fetchTopUsers();
              this.fetchTopQuestions();
            });
            return EMPTY;
          }else{
            return of(data.token);
          }

        }),
        filter(token=>token!==null),
        tap(tokenValue=>{
          this.authService._atoken.next(tokenValue);
        })
      ).subscribe(()=>{
        this.fetchUsers();
        this.fetchAnswers();
        this.fetchTopUsers();
        this.fetchTopQuestions();
      });
    }

    Plugins.App.addListener(
      'appStateChange',
      this.checkAuthOnResume.bind(this)
    );
  }

  fetchUsers(){
    this.authService.fetchTotalUsers().pipe(take(1)).subscribe(()=>{
      //console.log(this.authService.listU);
    });
  }

  fetchTopUsers(){
    this.authService.fetchTopUsers().pipe(take(1)).subscribe((users)=>{
      console.log(users);
    });
  }

  fetchTopQuestions(){
    this.appData.fetchTTQuestions().pipe(take(1)).subscribe((ques)=>{
      console.log(ques);
    });
  }

  fetchAnswers(){
    this.appData.fetchTotalAnswers().pipe(take(1)).subscribe(()=>{
      //console.log(this.appData.listA);
    });
  }

  toggleChange(){
    this.appData.icon.next(this.dark);
  }

  onLogout(){
    this.authService.logout();
  }

  ngOnDestroy(){
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    if(this.anonymous_sub){
      this.anonymous_sub.unsubscribe();
    }
    Plugins.App.removeAllListeners();
    this.networkListener.remove();
  }

  private checkAuthOnResume(state: AppState) {
    if (state.isActive) {
      this.authService
        .autoLogin()
        .pipe(take(1))
        .subscribe(success => {
          if (!success) {
            this.onLogout();
          }
        });
    }
  }

}
