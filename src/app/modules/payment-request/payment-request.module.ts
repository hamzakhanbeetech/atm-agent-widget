import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {PaymentRequestComponent} from '../../components/payment-request/payment-request.component';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterModule, Routes} from '@angular/router';

export const PaymentRequestModuleRoutes: Routes = [
  /* configure routes here */
  {
    path: '',
    component: PaymentRequestComponent
  }
];
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(PaymentRequestModuleRoutes),
    ReactiveFormsModule
  ],
  declarations: [PaymentRequestComponent]
})
export class PaymentRequestModule { }
