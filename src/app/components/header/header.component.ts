import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AuthComponent } from '../../modals/auth/auth.component';
import { AuthService } from '../../services & shared/auth.service';
import { SignupComponent } from '../../modals/signup/signup.component';
import { SearchComponent } from '../../modals/search/search.component';

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
    this.modalCtrl.create({component: AuthComponent}).then(modalEl=>{
      modalEl.present();
      return modalEl.onDidDismiss();
    }).then(resultData=>{
      if(resultData.role === 'confirm'){
        window.location.reload();
      }
    });
  }

  onSignup(){
    this.modalCtrl.create({component: SignupComponent}).then(modalEl=>{
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
