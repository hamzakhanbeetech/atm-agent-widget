import { NgModule } from '@angular/core';
import { KeyboardEvent } from './directives/keyboard-event.directive';
import { Autofocus } from './directives/autofocus.directive';
import { PopupComponent } from './components/popup/popup.component'
import { CommonModule } from '@angular/common';
@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    KeyboardEvent,
    Autofocus,
    PopupComponent
  ],
  exports: [
    KeyboardEvent,
    Autofocus,
    PopupComponent
  ]
})
export class JwCommonModule { }
