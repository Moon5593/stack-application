import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from './header.component';
import { AuthPage } from '../auth/auth.page';
import { RouterModule } from '@angular/router';
import { DropdownDirective } from './dropdown.directive';
import { SignupModalComponent } from '../pages/signup-modal/signup-modal.component';
import { SharedModule } from '../pages/shared.module';
import { SearchComponent } from './search/search.component';

@NgModule({
  imports: [
    ReactiveFormsModule,
    IonicModule,
    RouterModule,
    FormsModule,
    SharedModule
  ],
  declarations: [HeaderComponent, AuthPage, DropdownDirective, SignupModalComponent, SearchComponent],
  exports: [HeaderComponent],
  entryComponents: [AuthPage, SignupModalComponent, SearchComponent]
})
export class HeaderModule {}
