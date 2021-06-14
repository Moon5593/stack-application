import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { from, of, Subscription, EMPTY } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { AppDataService } from './app-data.service';
import { AppState, Plugins } from '@capacitor/core';
import { filter, switchMap, take, tap } from 'rxjs/operators';

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

  constructor(private appData: AppDataService, private authService: AuthService, private router: Router) {}

  ngOnInit(){
    this.authSub = this.authService.userIsAuthenticated.subscribe(isAuth => {
      if (!isAuth && this.previousAuthState !== isAuth) {

      }
      this.previousAuthState = isAuth;
      this.authService.userImage.pipe(take(1)).subscribe(image=>{
        this.urlImage = image;
        this.userImage = 'data:image/jpeg;base64,' + image;
      });
    });

    if(!this.previousAuthState){
      console.log('inside not previous auth');
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
                console.log('user expired');
                Plugins.Storage.remove({ key: 'authData' });
                return from(Plugins.Storage.get({ key: 'anonymousToken' }));
              }
            }
            console.log('empty');
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
              console.log('dated expired');
              Plugins.Storage.remove({ key: 'anonymousToken' });
              fetchedData = null;
            }
          }

          if (!fetchedData || !fetchedData.value) {
            console.log('anonymous not exist');
            this.authService.anonymousSignUp()
            .pipe(
              tap(tokenData=>{
              //console.log(tokenData);
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
            .subscribe(()=>{});
            return EMPTY;
          }else{
            return of(data.token);
          }

        }),
        filter(token=>token!==null),
        tap(tokenValue=>{
          console.log('anonymous exist');
          this.authService._atoken.next(tokenValue);
        })
      ).subscribe(()=>{});
    }

    Plugins.App.addListener(
      'appStateChange',
      this.checkAuthOnResume.bind(this)
    );
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
