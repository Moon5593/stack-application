import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, from, of } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { Plugins } from '@capacitor/core';

import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { Totals } from '../models/totals.model';

export interface AuthResponseData extends UserResponseData {
  kind?: string;
  idToken?: string;
  email?: string;
  refreshToken?: string;
  localId?: string;
  expiresIn?: string;
  registered?: boolean;
}

export interface UserResponseData{
  name?: string;
  badge?: string;
  imageUrl?: string;
  rep_points?: number;
}

export interface TotalData{
  users: number;
  questions: number;
  answers: number;
  best_answers: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private _user = new BehaviorSubject<User>(null);
  private activeLogoutTimer: any;
  public _atoken = new BehaviorSubject<string>(null);

  get userIsAuthenticated() {
    return this._user.asObservable().pipe(
      map(user => {
        if (user) {
          return !!user.token;
        } else {
          return false;
        }
      })
    );
  }

  get userId() {
    return this._user.asObservable().pipe(
      map(user => {
        if (user) {
          return user.id;
        } else {
          return null;
        }
      })
    );
  }

  get token() {
    return this._user.asObservable().pipe(
      map(user => {
        if (user) {
          return user.token;
        } else {
          return null;
        }
      })
    );
  }

  get userName(){
    return this._user.asObservable().pipe(
      map(user => {
        if (user) {
          return user.name;
        } else {
          return null;
        }
      })
    );
  }

  get userImage(){
    return this._user.asObservable().pipe(
      map(user => {
        if (user) {
          return user.imageUrl;
        } else {
          return null;
        }
      })
    );
  }

  get userPoints(){
    return this._user.asObservable().pipe(
      map(user => {
        if (user) {
          return user.rep_points;
        } else {
          return 0;
        }
      })
    );
  }

  get userBadge(){
    return this._user.asObservable().pipe(
      map(user => {
        if (user) {
          return user.badge;
        } else {
          return null;
        }
      })
    );
  }

  get aToken() {
    return this._atoken.asObservable().pipe(
      map(token => {
        if (token) {
          return token;
        } else {
          return null;
        }
      })
    );
  }

  constructor(private http: HttpClient) {}

  autoLogin() {
    return from(Plugins.Storage.get({ key: 'authData' })).pipe(
      map(storedData => {
        if (!storedData || !storedData.value) {
          return null;
        }
        const parsedData = JSON.parse(storedData.value) as {
          token: string;
          tokenExpirationDate: string;
          userId: string;
          email: string;
          name: string,
          badge: string,
          imageUrl: string,
          rep_points: number
        };
        const expirationTime = new Date(parsedData.tokenExpirationDate);
        if (expirationTime <= new Date()) {
          return null;
        }
        const user = new User(
          parsedData.userId,
          parsedData.email,
          parsedData.token,
          expirationTime,
          parsedData.name,
          parsedData.badge,
          parsedData.imageUrl,
          parsedData.rep_points
        );
        return user;
      }),
      tap(user => {
        if (user) {
          this._user.next(user);
          this.autoLogout(user.tokenDuration);
        }
      }),
      map(user => {
        return !!user;
      })
    );
  }

  anonymousSignUp(){
    return this.http
    .post<AuthResponseData>(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebaseAPIKey}`,
      {returnSecureToken: true});
  }

  signup(email: string, password: string, name: string, badge: string, imageUrl: string, rep_points: number, policy: boolean) {
    let resData;
    let user_res;
    return this.http
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${
          environment.firebaseAPIKey
        }`,
        { email: email, password: password, returnSecureToken: true }
      )
      .pipe(
      switchMap(userData=>{
        resData = userData;
        user_res={
          userId: userData.localId,
          name: name,
          email: email,
          badge: badge,
          imageUrl: imageUrl,
          rep_points: rep_points,
          policy: policy
        }
        return this.http.post<{ name: string }>(`https://stack-app-8a187-default-rtdb.firebaseio.com/users.json?auth=${userData.idToken}`,
          user_res
        );
      }),
      tap(()=>{
        this.setUserData(resData, user_res);
      })
    );
  }

  setTotals(){
    let fetchedToken;
    let total;
    return this.token
    .pipe(
      take(1),
      switchMap(token=>{
        fetchedToken = token;
        return this.http.get<{[key: string]: TotalData}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/totals.json?auth=${fetchedToken}`);
      }),
      switchMap(totalData=>{
        if(!totalData){
          total = new Totals(
            1,
            0,
            0,
            0
          );
          return this.http.post(`https://stack-app-8a187-default-rtdb.firebaseio.com/totals.json?auth=${fetchedToken}`,
          {...total});
        }
        for(let key in totalData){
          if(totalData.hasOwnProperty(key)){
            total = new Totals(
              totalData[key].users+1,
              totalData[key].questions,
              totalData[key].answers,
              totalData[key].best_answers
            );
          }
        }
        return this.http.put(`https://stack-app-8a187-default-rtdb.firebaseio.com/totals.json?auth=${fetchedToken}`,
        {...total});
      })
    );
  }

  login(email: string, password: string) {
      let resData;
      return this.http
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${
          environment.firebaseAPIKey
        }`,
        { email: email, password: password, returnSecureToken: true }
      )
      .pipe(
        switchMap(userData=>{
          resData = userData;
          return this.http.get<{[key: string]: UserResponseData}>(`https://stack-app-8a187-default-rtdb.firebaseio.com/users.json?orderBy="userId"&equalTo="${userData.localId}"&auth=${userData.idToken}`);
        }),
        map(userRes=>{
          console.log(userRes);
          let userData = {};
          for(const key in userRes){
            if(userRes.hasOwnProperty(key)){
              userData = {
                name: userRes[key].name,
                badge: userRes[key].badge,
                imageUrl: userRes[key].imageUrl,
                rep_points: userRes[key].rep_points
              };
            }
          }
          return userData;
        }),
        tap(userData=>{
          this.setUserData(resData, userData);
        })
      );
  }

  logout() {
    if (this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }
    this._user.next(null);
    Plugins.Storage.remove({ key: 'authData' });
  }

  ngOnDestroy() {
    if (this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }
  }

  private autoLogout(duration: number) {
    if (this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }
    this.activeLogoutTimer = setTimeout(() => {
      this.logout();
    }, duration);
  }

  private setUserData(userData: AuthResponseData, userRes: UserResponseData) {
    const expirationTime = new Date(
      new Date().getTime() + +userData.expiresIn * 1000
    );
    const user = new User(
      userData.localId,
      userData.email,
      userData.idToken,
      expirationTime,
      userRes.name,
      userRes.badge,
      userRes.imageUrl,
      userRes.rep_points
    );
    this._user.next(user);
    this.autoLogout(user.tokenDuration);
    this.storeAuthData(
      userData.localId,
      userData.idToken,
      expirationTime.toISOString(),
      userData.email,
      userRes.name,
      userRes.badge,
      userRes.imageUrl,
      userRes.rep_points
    );
  }

  private storeAuthData(
    userId: string,
    token: string,
    tokenExpirationDate: string,
    email: string,
    name: string,
    badge: string,
    imageUrl: string,
    rep_points: number
  ) {
    const data = JSON.stringify({
      userId: userId,
      token: token,
      tokenExpirationDate: tokenExpirationDate,
      email: email,
      name: name,
      badge: badge,
      imageUrl: imageUrl,
      rep_points: rep_points
    });
    Plugins.Storage.set({ key: 'authData', value: data });
    this._atoken.next(null);
    Plugins.Storage.remove({ key: 'anonymousToken' });
  }
}
