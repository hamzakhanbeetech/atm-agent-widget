/**
 * Created by cl-macmini-10 on 19/09/16.
 */
import { Component, Input } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import {ValidationService} from "../../services/validation.service";
@Component({
  selector: 'app-control-message',
  template: `<div *ngIf="errorMessage !== null">{{errorMessage}}</div>`,
  providers: [ValidationService],
  styles: ['div { font-size: 12px; color: red; margin-top: 5px; }']
})
export class ControlMessageComponent {
  //errorMessage: string;
  @Input() control: FormControl;
  constructor() { }
  get errorMessage() {
    for (let propertyName in this.control.errors) {
      if (this.control.errors.hasOwnProperty(propertyName) && this.control.touched) {
        return ValidationService.getValidatorErrorMessage(propertyName, this.control.errors[propertyName]);
      }
    }
    return null;
  }

}
