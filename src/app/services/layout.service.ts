import {EventEmitter, Injectable, OnDestroy} from '@angular/core';
import {FayeService} from './faye.service';
import {MessageStatus, MessageType, Typing, UserType} from '../enums/app.enums';
import {CommonService} from './common.service';
import {FuguWidgetService} from './fuguWidget.service';

declare const moment: any;
declare const require: any;
@Injectable()
export class LayoutService implements OnDestroy {
  alive = true;
  active_channel_object = null;
  uploadImageEmitter: EventEmitter<object> = new EventEmitter<object>();
  uploadingTextEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
  private uuidv4;
  constructor(private fayeService: FayeService, private commonService: CommonService, private fuguWidgetService: FuguWidgetService) {
    this.uuidv4 = require('uuid/v4');
  }

  filesUpload(file, channel_object , is_last_file) {
    if (file) {
      if (file.size > this.commonService.userDetails.max_file_size) {
        alert(`File size should be smaller than ${(this.commonService.userDetails.max_file_size / 1024 / 1024).toFixed(0)} mb.`);
        return;
      }
      const mime_type = file['type'] || 'application/octet-stream';
      const mimeTypeParent = mime_type.split('/');
      const formData: FormData = new FormData();
      formData.append('allow_all_mime_type', true);
      formData.append('access_token', this.commonService.userDetails.access_token);
      formData.append('file_type', mime_type);
      formData.append('file', file);
      const name = file.name.replace(/\,/g, '_');
      formData.append('file_name', name);
      this.uploadingTextEmitter.emit(true);
      const temp_channel_object = JSON.parse(JSON.stringify(channel_object));
      this.fuguWidgetService.sendImage(formData)
        .takeWhile(() => this.alive)
        .subscribe(
          async response => {
            if (is_last_file) {
              this.uploadingTextEmitter.emit(false);
            }
            let now = moment().utc().format();
            now = now.replace('Z', '.000Z');
            let d = {
              message: '',
              full_name: this.commonService.userDetails.full_name,
              user_id: this.commonService.userDetails.user_id,
              date_time: now,
              is_typing: Typing.Typing_End,
              user_type: UserType.Customer,
              file_name: name,
              message_status: MessageStatus.Sent,
              thumbnail_url: response.data.thumbnail_url
            };
            if (mimeTypeParent[0] == 'image' && !['vnd.adobe.photoshop', 'psd', 'tiff'].includes(mimeTypeParent[1])) {
              let appendObject = {
                message_type: MessageType.Image_Message,
                image_url: response.data.image_url
              };
              appendObject = Object.assign(appendObject, await this.getImageHeightWidth(file));
              d = Object.assign(d, appendObject);
            } else {
              const appendObject = {
                message_type: MessageType.File_Message,
                url: response.data.url,
                document_type: this.checkFileType(mimeTypeParent),
                file_size: this.calculateFileSize(file.size)
              };
              d = Object.assign(d, appendObject);
            }
            if ((temp_channel_object.channel_id == this.active_channel_object.channel_id
              && this.active_channel_object.channel_id > -1)) {
              this.uploadImageEmitter.emit(d);
            } else {
              if (temp_channel_object.channel_id != -1) {
                d['muid'] = this.uuidv4();
                this.fayeService.publishOnChannel(temp_channel_object.channel_id, d);
              }
            }
          },
          error => {
            const e = error.json();
          });
    }
  }
  calculateFileSize(size) {
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return !size && '0 Bytes' || (size / Math.pow(1024, i)).toFixed(2) + ' ' +
      ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][i];
  }
  getImageHeightWidth(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const image = new Image();
        image.src = e.target['result'];
        image.onload = () => {
          resolve({
            image_width: image.width,
            image_height: image.height
          });
        };
      };
    });
  }
  checkFileType(mimeTypeParent) {
    if (['audio', 'video'].includes(mimeTypeParent[0]) && !['ogg'].includes(mimeTypeParent[1])) {
      return mimeTypeParent[0];
    } else {
      return 'file';
    }
  }
  ngOnDestroy() {
    this.alive = false;
  }
}
