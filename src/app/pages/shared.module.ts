import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ImagePickerComponent } from './image-picker/image-picker.component';

@NgModule({
  declarations: [ImagePickerComponent],
  exports: [CommonModule, ImagePickerComponent],
  imports: [CommonModule]
})
export class SharedModule {}