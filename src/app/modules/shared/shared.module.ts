import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { JwCommonModule } from '../jw-common/jw-common.module';
// import { KeysPipe, OrderByPipe, DateTimePipe , UrlPhonePipe }
import { Autofocus } from 'app/directives/autofocus.directive';
import {KeysPipe, OrderByPipe, UrlPhonePipe, DateTimePipe} from 'app/pipes/pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ControlMessageComponent } from 'app/components/control-message/control-message.component';
export const SharedModuleRoutes: Routes = [
  /* configure routes here */

];
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(SharedModuleRoutes),
    JwCommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [
    KeysPipe,
    OrderByPipe,
    UrlPhonePipe,
    Autofocus,
    DateTimePipe,
    ControlMessageComponent
  ],
  exports: [
    KeysPipe,
    OrderByPipe,
    UrlPhonePipe,
    Autofocus,
    DateTimePipe,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent
  ],
  providers: [
  ]
})
export class SharedModule { }
