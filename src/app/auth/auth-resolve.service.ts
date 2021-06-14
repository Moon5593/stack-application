import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { of } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthResolver implements Resolve<any>{

    constructor(private authService: AuthService, private toastCtrl: ToastController){}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot){
      return this.authService.userIsAuthenticated.pipe(
        take(1),
        switchMap(isAuthenticated => {
          if (!isAuthenticated) {
            return this.authService.autoLogin();
          } else {
            return of(isAuthenticated);
          }
        }),
        tap(isAuthenticated => {
          console.log(isAuthenticated);
          if (!isAuthenticated) {
            this.toastCtrl.create({message: 'You are not logged In.', duration: 2000})
            .then(toastEl=>{
              toastEl.present();
            });
          }
        })
      );

    }
}
