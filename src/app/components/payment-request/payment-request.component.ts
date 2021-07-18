import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {FuguWidgetService} from '../../services/fuguWidget.service';

@Component({
  selector: 'app-payment-request',
  templateUrl: './payment-request.component.html',
  styleUrls: ['./payment-request.component.css']
})
export class PaymentRequestComponent implements OnInit, OnDestroy {

  paymentForm: FormGroup;
  paymentOptions: FormArray;
  paymentObj = {
    total_amount: 0,
    image_url: ''
  };
  alive = true;
  currencies = [
    {
      'currency_id': 1,
      'symbol': '$',
      'code': 'USD',
      'name': 'United States dollar'
    },
    {
      'currency_id': 2,
      'symbol': '‎€',
      'code': 'EUR',
      'name': 'Euro'
    },
    {
      'currency_id': 3,
      'symbol': '¥‎',
      'code': 'JPY',
      'name': 'Japanese yen'
    },
    {
      'currency_id': 4,
      'symbol': '£',
      'code': 'GBP',
      'name': 'Pound sterling'
    },
    {
      'currency_id': 5,
      'symbol': '$',
      'code': 'AUD',
      'name': 'Australian dollar'
    },
    {
      'currency_id': 6,
      'symbol': 'C$',
      'code': 'CAD',
      'name': 'Canadian dollar'
    },
    {
      'currency_id': 7,
      'symbol': 'Fr.',
      'code': 'CHF',
      'name': 'Swiss franc'
    },
    {
      'currency_id': 8,
      'symbol': '¥',
      'code': 'CNY',
      'name': 'Chinese yuan'
    },
    {
      'currency_id': 9,
      'symbol': 'kr',
      'code': 'SEK',
      'name': 'Swedish krona'
    },
    {
      'currency_id': 10,
      'symbol': 'Mex$',
      'code': 'MXN',
      'name': 'Mexican peso'
    },
    {
      'currency_id': 11,
      'symbol': 'NZ$',
      'code': 'NZD',
      'name': 'New Zealand dollar'
    },
    {
      'currency_id': 12,
      'symbol': 'S$',
      'code': 'SGD',
      'name': 'Singapore dollar'
    },
    {
      'currency_id': 13,
      'symbol': 'HK$',
      'code': 'HKD',
      'name': 'Hong Kong dollar'
    },
    {
      'currency_id': 14,
      'symbol': 'kr',
      'code': 'NOK',
      'name': 'Norwegian krone'
    },
    {
      'currency_id': 15,
      'symbol': '₩',
      'code': 'KRW',
      'name': 'South Korean won'
    },
    {
      'currency_id': 16,
      'symbol': '₹',
      'code': 'INR',
      'name': 'Indian rupee'
    },
    {
      'currency_id': 17,
      'symbol': '₽',
      'code': 'RUB',
      'name': 'Russian ruble'
    },
    {
      'currency_id': 18,
      'symbol': 'R',
      'code': 'ZAR',
      'name': 'South African rand'
    },
    {
      'currency_id': 19,
      'symbol': 'KSh',
      'code': 'KES',
      'name': 'Kenyan Shilling'
    },
    {
      'currency_id': 20,
      'symbol': 'ZK',
      'code': 'ZMW',
      'name': 'Zambian Kwacha'
    },
    {
      'currency_id': 21,
      'symbol': 'AED',
      'code': 'AED',
      'name': 'Arab Emirates Dirham'
    },
    {
      'currency_id': 22,
      'symbol': 'E£',
      'code': 'EGP',
      'name': 'Egyptian Pound'
    },
    {
      'currency_id': 23,
      'symbol': 'S',
      'code': 'PEN',
      'name': 'Peruvian Sol'
    },
    {
      'currency_id': 24,
      'symbol': 'UGX',
      'code': 'UGX',
      'name': 'Ugandan Shilling'
    },
    {
      'currency_id': 25,
      'symbol': 'ع.د',
      'code': 'IQD',
      'name': 'Iraqi Dinar'
    },
    {
      'currency_id': 26,
      'symbol': '﷼',
      'code': 'QAR',
      'name': 'Qatari Riyal'
    },
    {
      'currency_id': 27,
      'symbol': '$',
      'code': 'COP',
      'name': 'Colombian Peso'
    },
    {
      'currency_id': 28,
      'symbol': 'kr',
      'code': 'SEK',
      'name': 'Swedish Krona'
    },
    {
      'currency_id': 29,
      'symbol': '₦',
      'code': 'NGN',
      'name': 'Nigerian Naira'
    },
    {
      'currency_id': 30,
      'symbol': 'RM',
      'code': 'MYR',
      'name': 'Malaysian Ringgit'
    },
    {
      'currency_id': 31,
      'symbol': 're',
      'code': 'RES',
      'name': 'res'
    }
  ];
  active_channel_id;
  // @ViewChild('fileInput') fileInput;
  constructor(private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.active_channel_id = window['channel_id'];
    // this.fuguWidgetService.fuguWidgetData = window['widget_data'];
    this.paymentForm = this.formBuilder.group({
      title: [ '' , [ Validators.required]],
      currency: [''],
      items_description: this.formBuilder.array([ this.createItemOption() ])
    });
    this.paymentForm.patchValue({
      currency: '$'
    });
    this.paymentOptions = this.paymentForm.get('items_description') as FormArray;
  }

  createItemOption() {
    return this.formBuilder.group({
      header: ['', Validators.required],
      content: ['', [Validators.required, Validators.min(0.01)]]
    });
  }

  addOption(): void {
    this.paymentOptions = this.paymentForm.get('items_description') as FormArray;
    this.paymentOptions.push(this.createItemOption());
  }

  removeOption(index): void {
    this.paymentOptions.removeAt(index);
  }

  calculateTotalAmount() {
    this.paymentObj.total_amount = 0;
    this.paymentForm.get('items_description')['controls'].forEach(
      group => {
        this.paymentObj.total_amount += group.controls['content'].value;
      }
    );
    this.paymentObj.total_amount = Number(this.paymentObj.total_amount.toFixed(2));
  }
  checkPriceLength(index) {
    const priceLength = this.paymentForm.get('items_description')['controls'][index].controls['content'].value || 0;
    if (priceLength.toString().length > 10) {
      this.paymentOptions.at(index).patchValue({
        content: Number(this.paymentForm.get('items_description')['controls'][index].controls['content'].value.toString().slice(0, 10))
      });
    }
  }
  // onAttchmentClick(fileControl) {
  //   fileControl.click();
  // }
  // onFileSelect(event) {
  //   if (event.target.files[0]) {
  //     const formData: FormData = new FormData();
  //     formData.append('file_type', 'image/*');
  //     formData.append('file', (event.target.files[0]));
  //     this.fuguWidgetService.sendImage(formData)
  //       .takeWhile(() => this.alive)
  //       .subscribe(
  //         response => {
  //           this.paymentObj.image_url = response.data.thumbnail_url;
  //         },
  //         error => {
  //         });
  //   }
  // }
  ngOnDestroy() {
    this.alive = false;
  }
  requestPayment() {
    const description_array = [];
    this.paymentForm.controls.items_description.value.forEach(value => {
      description_array.push({
        header: value.header,
        content: `${this.paymentForm.controls.currency.value} ${value.content}`
      });
    });
    const data = {
      channel_id: this.active_channel_id,
      custom_action: {
        title: this.paymentForm.controls.title.value,
        amount: this.paymentObj.total_amount,
        currency_symbol: this.paymentForm.controls.currency.value,
        description: description_array,
        action_buttons: [{
          button_text: 'Pay',
          button_action: {
            title: this.paymentForm.controls.title.value,
            amount: this.paymentObj.total_amount,
            currency_symbol: this.paymentForm.controls.currency.value,
            description: description_array,
            'reference': '',
            'action_type': 'NATIVE_ACTIVITY'
          }
        }]
      }
    };
    window.opener.postMessage({ type: 'paymentRequest', data: data }, '*');
    window.close();
  }
}
