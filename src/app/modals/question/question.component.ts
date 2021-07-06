import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ModalController } from '@ionic/angular';

function base64toBlob(base64Data, contentType) {
  contentType = contentType || '';
  const sliceSize = 1024;
  const byteCharacters = window.atob(base64Data);
  const bytesLength = byteCharacters.length;
  const slicesCount = Math.ceil(bytesLength / sliceSize);
  const byteArrays = new Array(slicesCount);

  for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    const begin = sliceIndex * sliceSize;
    const end = Math.min(begin + sliceSize, bytesLength);

    const bytes = new Array(end - begin);
    for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0);
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes);
  }
  return new Blob(byteArrays, { type: contentType });
}

@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss'],
})
export class QuestionComponent implements OnInit {
  form: FormGroup;
  tags: string[] = [];
  image: string;
  add_answers_img: string[] = [];
  formImageValue: string;

  constructor(private modalCtrl: ModalController, private loadingCtrl: LoadingController) {}

  ngOnInit() {
    this.form = new FormGroup({
      question: new FormControl(null, {
        validators: [Validators.required, Validators.maxLength(244), Validators.minLength(1)]
      }),
      catagory: new FormControl('select_cat', {
        validators: [Validators.required, this.selectCatagory.bind(this)]
      }),
      tags: new FormControl(null, {
        validators: [Validators.required]
      }),
      checkbox: new FormControl(undefined),
      checkbox_img: new FormControl(undefined),
      add_answers: new FormArray([new FormGroup({
        answer: new FormControl(undefined)
      })]),
      image: new FormControl(null),
      details: new FormControl(null, {
        validators: [Validators.required, Validators.maxLength(244)]
      }),
      anonymous: new FormControl(undefined),
      private: new FormControl(undefined),
      notif: new FormControl(undefined),
      policy: new FormControl(undefined, {
        validators: [Validators.required]
      })
    });
  }

  comma_pressed(event){
    if(event.key === ',' && this.form.value.tags!==null && this.form.value.tags!==undefined && this.form.value.tags!==',' && this.form.value.tags!==''){
      this.tags.push(this.form.value.tags);
      //console.log(this.tags);
    }
  }

  reset_input(event){
    if(event.key === ','){
      this.form.patchValue({tags: ''});
      this.form.controls['tags'].setErrors(null);
    }
  }

  tagLostFocus(event){
    if(event.target.value!==null){
      //console.log(event.target.value);
      if(this.form.value.tags!==null && this.form.value.tags!==undefined && this.form.value.tags!==',' && this.form.value.tags!==''){
        this.tags.push(this.form.value.tags);
        this.form.patchValue({tags: ''});
        this.form.controls['tags'].setErrors(null);
      }
    }
  }

  delClicked(i: number){
    this.tags.splice(i, 1);
  }

  get controls() {
    //console.log((<FormArray>this.form.get('add_answers')).controls.length);
    return (<FormArray>this.form.get('add_answers')).controls;
  }

  /*tagChecker(control: FormControl):{[s: string]: boolean}{
    if(this.tags.indexOf(control.value)!==-1){
      return null;
    }
    return {'tagNotAccepted': true};
  }*/

  selectCatagory(control: FormControl): {[s: string]: boolean} {
    if (control.value!=='select_cat') {
      return null;
    }else{
      return {'catagoryUnaccepted': true};
    }
  }

  onAddAnswer(){
    (<FormArray>this.form.get('add_answers')).push(
      new FormGroup({
        'answer': new FormControl(null, Validators.required)
      })
    );
  }

  onDeleteAnswer(i: number){
    (<FormArray>this.form.get('add_answers')).removeAt(i);
  }

  onImagePicked(imageData: string | File, isFeatured?: string) {
    let imageFile;
    
    if (typeof imageData === 'string') {
      this.image = imageData;
      try {
        imageFile = base64toBlob(
          imageData.replace('data:image/jpeg;base64,', ''),
          'image/jpeg'
        );
      } catch (error) {
        console.log(error);
        return;
      }
    } else {
      const fr = new FileReader();
      fr.onload = () => {
        let dataUrl = fr.result.toString();
        //console.log(dataUrl);
        dataUrl = dataUrl.replace('data:image/jpeg;base64,', '');
        this.image =  dataUrl;
      };
      fr.readAsDataURL(imageData);

      imageFile = imageData;
    }
    if(this.form.get('checkbox_img').value){
      (<FormArray>this.form.get('add_answers')).controls[this.controls.length-1].patchValue({ answer: imageFile });
      if(isFeatured==='featured'){
        console.log('featured picked');
        this.form.patchValue({ image: imageFile });
        this.formImageValue = this.image;
      }else{
        this.add_answers_img.push(this.image);
      }
    }else{
      this.form.patchValue({ image: imageFile });
      if(isFeatured==='featured'){
        console.log('featured picked');
        this.formImageValue = this.image;
      }
    }
    
  }

  check(event){
    if(!event){
      this.form.get('add_answers').reset();
    }
  }

  onCancel(){
    this.modalCtrl.dismiss(null, 'cancel');
  }

  onCreateQ(){
    if(!this.form.valid){
      return;
    }
    console.log(this.form);
    if((<FormArray>this.form.get('add_answers')).length<=1){
      this.form.value.add_answers = null;
    }
    if(this.form.get('checkbox_img').value){
      this.modalCtrl.dismiss({postingData: {
        question: this.form.value.question,
        catagory: this.form.value.catagory,
        tags: this.tags,
        add_answers: this.add_answers_img,
        image: this.formImageValue,
        details: this.form.value.details,
        current_date: new Date().toISOString(),
        anonymous: this.form.value.anonymous,
        private_question: this.form.value.private,
        notif: this.form.value.notif,
        policy: this.form.value.policy
      }}, 'confirm');
    }else{
      this.modalCtrl.dismiss({postingData: {
        question: this.form.value.question,
        catagory: this.form.value.catagory,
        tags: this.tags,
        add_answers: this.form.value.add_answers,
        image: this.formImageValue,
        details: this.form.value.details,
        current_date: new Date().toISOString(),
        anonymous: this.form.value.anonymous,
        private_question: this.form.value.private,
        notif: this.form.value.notif,
        policy: this.form.value.policy
      }}, 'confirm');
    }
    
  }

}
