import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { IonSearchbar, ModalController } from '@ionic/angular';
import { AuthPage } from '../auth/auth.page';
import { AuthService } from '../auth/auth.service';
import { SignupModalComponent } from '../pages/signup-modal/signup-modal.component';
import { SearchComponent } from './search/search.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  is_dark: boolean;
  @Input() auth: boolean;
  @Input() userImage: string;
  @Input() urlImage: string;
  show_dropdown: boolean = false;

  constructor(
    private authService: AuthService,
    private modalCtrl: ModalController
    ) {}

  ngOnInit() {}

  toggleDropdown(e: boolean){
    this.show_dropdown = e;
  }

  onLogin(){
    this.modalCtrl.create({component: AuthPage}).then(modalEl=>{
      modalEl.present();
      return modalEl.onDidDismiss();
    }).then(resultData=>{
      if(resultData.role === 'confirm'){
        window.location.reload();
      }
    });
  }

  onSignup(){
    this.modalCtrl.create({component: SignupModalComponent}).then(modalEl=>{
      modalEl.present();
      return modalEl.onDidDismiss();
    }).then(resultData=>{
      if(resultData.role === 'confirm'){
        window.location.reload();
      }
    });
  }

  onSelection(str: string){
    if(str==='logout'){
      this.show_dropdown = false;
      this.authService.logout();
      window.location.reload();
    }
  }

  search(){
    this.modalCtrl.create({component: SearchComponent}).then(modalEl=>{
      modalEl.cssClass = 'custom';
      modalEl.present();
      return modalEl.onDidDismiss();
    }).then(resultData=>{});
  }
}
