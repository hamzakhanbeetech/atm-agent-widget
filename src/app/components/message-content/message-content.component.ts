import {Component, OnInit, Input, EventEmitter, Output} from '@angular/core';
import { FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { MessageType , UserType , Typing } from "../../enums/app.enums";
import { CommonService } from "../../services/common.service";
import { ControlMessageComponent } from "../control-message/control-message.component";
import { ValidationService } from "../../services/validation.service";
import { FuguWidgetService } from "../../services/fuguWidget.service";
import { FayeService } from "../../services/faye.service";
import {el} from "@angular/platform-browser/testing/src/browser_util";


declare var require: any;
declare var moment: any;

@Component({
  selector: 'app-message-content',
  templateUrl: './message-content.component.html',
  styleUrls: ['./message-content.component.css']
})
export class MessageContentComponent implements OnInit {
  @Input() messageItem: any;
  @Output() openMediaPlayer = new EventEmitter();
  MessageTypeEnum = MessageType;
  detailsForm: FormGroup;
  currentIndex = 0;
  detailsFields: Array<any> = [];
  rating: number = -1;
  commentToSend: '';
  emojis: Array<any> = [
    {
      src: 'assets/img/terrible.svg',
      title: 'Terrible',
      rating: 1
    },
    {
      src: 'assets/img/bad.svg',
      title: 'Bad',
      rating: 2
    },
    {
      src: 'assets/img/okay.svg',
      title: 'Okay',
      rating: 3
    },
    {
      src: 'assets/img/good.svg',
      title: 'Good',
      rating: 4
    },
    {
      src: 'assets/img/great.svg',
      title: 'Great',
      rating: 5
    }
  ];
  private uuidv4;
  constructor(public commonService: CommonService , public fayeService: FayeService, public fuguWidgetService: FuguWidgetService, private formBuilder: FormBuilder) { }
  initForm() {
    this.detailsForm = this.formBuilder.group({
      'inputControl': [ '' , [ Validators.required ] ]
    });
    switch (this.detailsFields[ this.currentIndex ].type) {
      case 'email':
        this.detailsForm.get('inputControl').setValidators( [ Validators.required , ValidationService.emailValidator] );
        break;
    }
  }
  ngOnInit() {
    this.uuidv4 = require('uuid/v4');
    // if(this.messageItem.user_type == 0 || this.messageItem.user_id == 0 ) {
    //   alert('message');
    // }
    switch (this.messageItem.message_type) {
      case this.MessageTypeEnum.Form_Message:
        let i = 0;
        for( i = 0 ; i < this.messageItem.content_value[0].questions.length ; i++ ) {
          this.appendField(i);
          if( !this.messageItem.values[i] ) {
            this.currentIndex = i;
            this.initForm();
            break;
          }
        }
        if (this.currentIndex != i) {
          this.currentIndex = this.detailsFields.length;
        }
        break;
      case this.MessageTypeEnum.Feedback_Message:
        this.rating = this.messageItem.rating_given;
        this.commentToSend = this.messageItem.comment;
        break;
    }
  }
  appendField(index) {
    const field = {
      value: this.messageItem.values[index] || '',
      title: this.messageItem.content_value[0].questions[index],
      type: this.messageItem.content_value[0].data_type[index] == 'string' ? 'text' : this.messageItem.content_value[0].data_type[index]
    };
    this.detailsFields.push(field);
  }
  setDetail(index) {
    this.commonService.fireAllErrors(this.detailsForm);
    const currentValue = this.detailsForm.value.inputControl.trim();
    if(this.detailsForm.valid && currentValue) {
      this.messageItem.values.push(currentValue);
      let body = {
        message_id: this.messageItem.id,
        values: this.messageItem.values,
        index: 3,
        app_secret_key: this.fuguWidgetService.fuguWidgetData.appSecretKey,
        user_id: this.commonService.userDetails.user_id,
        muid: this.messageItem.muid
      };

      this.fayeService.sendMessage(body);
      this.detailsFields[index].value = currentValue;
      if(this.currentIndex + 1 < this.messageItem.content_value[0].questions.length) {
        this.appendField(this.currentIndex + 1);
      }
      this.currentIndex = index + 1;
      if(index + 1 < this.detailsFields.length) {
        let that = this;
        setTimeout(function () {
          that.initForm();
        });
      }
    }
  }

  openImage(image_url) {
    this.commonService.postMessageToParentWindow({ type: "Image", data: image_url });
  }


  selectRating(rating) {
    this.rating = rating;
  }
  submitRating() {
    if(this.rating > 0) {
      const now = moment().utc().format();
      this.messageItem.is_rating_given = 1;
      this.messageItem.rating_given = this.rating;
      this.messageItem.comment = this.commentToSend;
      this.messageItem.user_id = this.commonService.userDetails.user_id;
      this.messageItem.total_rating = 5;
      this.fayeService.sendMessage(this.messageItem);
    }
  }
  onTextarea_keydown(e: KeyboardEvent) {
    if (!e.shiftKey && e.keyCode == 13) {
      this.submitRating();
      return false;
    }
  }

  autoGrow(e: any) {
    const elm = e.target;
    if (elm.scrollHeight < 95) {
      elm.style.height = (elm.scrollHeight) + 'px';
    } else {
      elm.style.height = '95px';
    }
  }
  sendPaymentMessage(btn_info, messageItem) {
    console.log({
      button_info: btn_info,
      message_data: messageItem.custom_action
    });
    this.commonService.postMessageToParentWindow({ type: 'PaymentMessage', data: {
        button_info: btn_info,
        message_data: messageItem.custom_action
      }
    });
  }


}
