import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ImagePickerComponent } from '../components/image-picker/image-picker.component';

@NgModule({
  declarations: [ImagePickerComponent],
  imports: [CommonModule],
  exports: [CommonModule, ImagePickerComponent]
})
export class SharedModule {}
