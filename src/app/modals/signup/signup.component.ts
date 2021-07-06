import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { AuthService } from 'src/app/services & shared/auth.service';

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
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent implements OnInit {
  isLoading = false;
  form: FormGroup;
  image: string;

  constructor(
    private modalCtrl: ModalController,
    private authS: AuthService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router
    ) {}

  ngOnInit() {
    this.form = new FormGroup({
      username: new FormControl(null, {
        validators: [Validators.required, Validators.pattern('^(?=[a-zA-Z0-9._]{6,20}$)(?!.*[_.]{2})[^_.].*[^_.]$')]
      }),
      email: new FormControl(null, {
        validators: [Validators.required, Validators.email]
      }),
      image: new FormControl(null),
      password: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(6)]
      }),
      c_password: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(6)]
      }),
      checkbox: new FormControl(undefined, {
        validators: [Validators.required]
      })
    }, this.notMatch);
  }

  notMatch(f: FormGroup):{[s: string]: boolean}{
    return f.get('password').value===f.get('c_password').value ? null : {
      'mismatch': true
    };
  }

  onCancel(){
    this.modalCtrl.dismiss(null, 'cancel');
  }

  onCreateUser(){
    if(!this.form.valid){
      return;
    }

    this.loadingCtrl
      .create({ message: 'Signing up...' })
      .then((loadingEl)=>{
        loadingEl.present();
        this.authS.signup(
          this.form.value.email, 
          this.form.value.password, 
          this.form.value.username, 
          'Beginner', 
          this.image, 
          30,
          this.form.value.checkbox)
        .subscribe(
          resData => {
            //console.log(resData);
            this.form.reset();
            this.isLoading = false;
            loadingEl.dismiss();
            this.modalCtrl.dismiss({}, 'confirm');
          },
          errRes => {
            loadingEl.dismiss();
            const code = errRes.error.error.message;
            let message = 'Could not sign you up, please try again.';
            if (code === 'EMAIL_EXISTS') {
              message = 'This email address exists already!';
            } else if (code === 'EMAIL_NOT_FOUND') {
              message = 'E-Mail address could not be found.';
            } else if (code === 'INVALID_PASSWORD') {
              message = 'This password is not correct.';
            }
            this.showAlert(message);
          }
        );
      });
  }

  onImagePicked(imageData: string | File) {
    let imageFile;
    if (typeof imageData === 'string') {
      this.image = imageData;
      //console.log(imageData);
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
    this.form.patchValue({ image: imageFile });
  }

  private showAlert(message: string) {
    this.alertCtrl
      .create({
        header: 'Authentication failed',
        message: message,
        buttons: ['Okay']
      })
      .then(alertEl => alertEl.present());
  }

}
