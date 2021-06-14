import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
})
export class ReportComponent implements OnInit {
  form: FormGroup;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.form = new FormGroup({
      details: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(1), Validators.maxLength(244)]
      })
    });
  }

  onReportQ(){
    if(!this.form.valid){
      this.form.controls['details'].setErrors(null);
      return;
    }
    console.log(this.form);
    this.modalCtrl.dismiss({
      report: {
        details: this.form.value.details
      }
    }, 'confirm');
  }

  onCancel(){
    this.modalCtrl.dismiss(null, 'cancel');
  }

}
