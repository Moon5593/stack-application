import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from './header.component';
import { AuthComponent } from '../../modals/auth/auth.component';
import { RouterModule } from '@angular/router';
import { DropdownDirective } from '../../services & shared/dropdown.directive';
import { SignupComponent } from '../../modals/signup/signup.component';
import { SharedModule } from '../../services & shared/shared.module';
import { SearchComponent } from '../../modals/search/search.component';

@NgModule({
  imports: [
    ReactiveFormsModule,
    IonicModule,
    RouterModule,
    FormsModule,
    SharedModule
  ],
  declarations: [HeaderComponent, AuthComponent, DropdownDirective, SignupComponent, SearchComponent],
  exports: [HeaderComponent],
  entryComponents: [AuthComponent, SignupComponent, SearchComponent]
})
export class HeaderModule {}
