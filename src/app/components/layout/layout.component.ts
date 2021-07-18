import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FayeService } from 'app/services/faye.service';
import { MessageType, Typing, UserType, MessageStatus } from 'app/enums/app.enums';
import { CommonService } from 'app/services/common.service';

declare var moment: any;

interface VideoCallMessage {
  full_name?: string;
  user_id: any;
  sdp?: string;
  rtc_candidate?: string;
  notification_type: any;
  video_call_type: any;
  user_thumbnail_image?: string;
  channel_id: string;
  muid: string;
}
const RTCCallType = {
  AUDIO: 'AUDIO',
  VIDEO: 'VIDEO'
};

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  public MessageTypeEnum = MessageType;
  caller_info = <VideoCallMessage>{};
  video_call_obj = {
    is_video_open: false,
    is_video_caller: false,
    video_offer_data: {},
    incoming_call_popup: false,
    channel_id: null,
    channel_image: '',
    user_name: '',
    user_id: 0,
    full_name: ''
  };
  VideoCallType = {
    START_CALL: 'START_CALL',
    CALL_REJECTED: 'CALL_REJECTED',
    READY_TO_CONNECT: 'READY_TO_CONNECT',
    CALL_HUNG_UP: 'CALL_HUNG_UP',
    USER_BUSY: 'USER_BUSY',
    VIDEO_OFFER: 'VIDEO_OFFER',
    NEW_ICE_CANDIDATE: 'NEW_ICE_CANDIDATE',
    VIDEO_ANSWER: 'VIDEO_ANSWER'
  };
  showVideoCallReceived;
  private alive = true; // for unsubscribing to observables
  constructor(public fayeService: FayeService, public commonService: CommonService, private cdRef: ChangeDetectorRef, ) {}

  ngOnInit() {
    console.log("layout component loaded")
    this.onWindowReceiveData();
    // this.fayeService.chatNonReassignEvent
    //   .takeWhile(() => this.alive)
    //   .subscribe(data => this.onVideoCallAssignEvent(data));
  }

  // private onVideoCallAssignEvent(data) {
  //   if (this.commonService.is_collapsed) {
  //     return;
  //   }
  //   switch (data.message_type) {
  //     case this.MessageTypeEnum.Video_Call:
  //       if (data.user_id != this.commonService.userDetails.user_id) { // not equal to your own id
  //         switch (data.video_call_type) {
  //           case this.VideoCallType.START_CALL:
  //             if (!this.video_call_obj.incoming_call_popup && !this.video_call_obj.is_video_open) {
  //               this.caller_info = data;
  //               // const iceConfigData = this.sessionService.get('loginData/v1')['turn_credentials'];
  //               this.createVideoCallMessage(data.channel_id, {
  //                 // turn_creds: iceConfigData,
  //                 video_call_type: this.VideoCallType.READY_TO_CONNECT,
  //                 muid: data.muid
  //               });
  //               this.cdRef.detectChanges();
  //             } else if (data.muid != this.caller_info.muid) {
  //               this.createVideoCallMessage(data.channel_id, {
  //                 video_call_type: this.VideoCallType.USER_BUSY,
  //                 is_silent: true,
  //                 muid: data.muid
  //               });
  //             }
  //             break;
  //           case this.VideoCallType.VIDEO_OFFER:
  //             if (!this.video_call_obj.incoming_call_popup && !this.video_call_obj.is_video_open) {
  //               this.onVideoCallReceived(data);
  //               this.video_call_obj.video_offer_data = data;
  //             }
  //             break;
  //           case this.VideoCallType.CALL_HUNG_UP:
  //             console.log(this.video_call_obj, this.caller_info);
  //             if (!this.video_call_obj.is_video_open && this.video_call_obj.incoming_call_popup
  //               && this.caller_info.muid == data.muid) {
  //               this.stopVideoCallRinger();
  //               this.showVideoCallReceived = false;
  //               this.playNotificationSound('assets/audio/disconnect_call', false);
  //               this.video_call_obj.incoming_call_popup = false;
  //             }
  //             break;
  //         }
  //         break;
  //       } else {
  //         switch (data.video_call_type) {
  //           case this.VideoCallType.CALL_HUNG_UP:
  //             if (!this.video_call_obj.is_video_open && this.video_call_obj.incoming_call_popup
  //               && this.video_call_obj.incoming_call_popup
  //               && this.caller_info.muid == data.muid) {
  //               this.showVideoCallReceived = false;
  //               this.stopVideoCallRinger();
  //               this.playNotificationSound('assets/audio/disconnect_call', false);
  //               this.video_call_obj.incoming_call_popup = false;
  //             }
  //             break;
  //           case this.VideoCallType.CALL_REJECTED:
  //             if (!this.video_call_obj.is_video_open && this.video_call_obj.incoming_call_popup) {
  //               this.showVideoCallReceived = false;
  //               this.stopVideoCallRinger();
  //               this.playNotificationSound('assets/audio/disconnect_call', false);
  //               this.video_call_obj.incoming_call_popup = false;
  //             }
  //             break;
  //         }
  //       }
  //   }
  // }
  // stopVideoCallRinger() {
  //   const sound = <HTMLAudioElement>document.getElementById('sound-div');
  //   if (sound) {
  //     sound.src = '';
  //   }
  // }
  // acceptVideoCall() {
  //   this.stopVideoCallRinger();
  //   // jQuery('#videoCallPopup').modal('hide');
  //   this.showVideoCallReceived = false;
  //   this.video_call_obj.incoming_call_popup = false;
  //   this.video_call_obj.is_video_caller = false;
  //   this.video_call_obj.is_video_open = true;
  //   const winRef = window.open('/#/call' , '_blank', 'toolbar=yes,scrollbars=yes,resizable=yes,top=100,left=250,width=800,height=600');
  //   winRef['call_data'] = this.video_call_obj;
  // }

  // rejectVideoCall() {
  //   this.createVideoCallMessage(this.caller_info.channel_id, {
  //     video_call_type: this.VideoCallType.CALL_REJECTED,
  //     muid: this.video_call_obj.video_offer_data['muid']
  //   });
  //   this.stopVideoCallRinger();
  //   this.video_call_obj.incoming_call_popup = false;
  //   this.caller_info = <VideoCallMessage>{};
  //   this.showVideoCallReceived = false;
  //   this.cdRef.detectChanges();
  // }
  // onVideoCallReceived(data) {
  //   this.video_call_obj.incoming_call_popup = true;
  //   this.video_call_obj.channel_id = data.channel_id;
  //   this.video_call_obj.user_id = this.commonService.userDetails.user_id;
  //   this.video_call_obj.full_name = this.commonService.userDetails.full_name;
  //   this.playNotificationSound('assets/audio/video_call_ringtone', true);
  //   this.showVideoCallReceived = true;
  //   this.cdRef.detectChanges();
  // }
  // createVideoCallMessage(channel_id, data) {
  //   let now = moment().utc().format();
  //   now = now.replace('Z', '.000Z');
  //   const obj = {
  //     full_name: this.commonService.userDetails.full_name,
  //     user_id: this.commonService.userDetails.user_id,
  //     date_time: now,
  //     message: '',
  //     is_typing: Typing.Typing_End,
  //     message_type: MessageType.Video_Call,
  //     user_type: UserType.Customer,
  //     message_status: MessageStatus.Sending,
  //     is_silent: data.video_call_type != 'START_CALL'
  //   };
  //   this.fayeService.publishOnChannel(channel_id, Object.assign(obj, data));
  // }
  playNotificationSound(filename, loop) {
    document.getElementById('video-sound').innerHTML = '<audio id="sound-div" autoplay="autoplay">' +
      '<source src="' + filename + '.mp3" type="audio/mpeg" />' +
      '<source src="' + filename + '.ogg" type="audio/ogg" />' +
      '<embed hidden="true" autostart="true" loop="false" src="' + filename + '.mp3" /></audio>';
    const audio = <HTMLAudioElement>document.getElementById('sound-div');
    audio.loop = loop;
  }
  onWindowReceiveData() {
    window.addEventListener('message', (e) => {
      switch (e.data.type) {
        // case 'video-call':
        //   this.video_call_obj.is_video_open = e.data.data.is_video_open;
        //   this.caller_info = <VideoCallMessage>{};
        //   console.log('window opener data received' + this.video_call_obj.is_video_open);
        //   break;
        case 'paymentRequest':
          this.commonService.newPostMessageReceived.emit(e.data.data);
          break;
      }
    });
  }
  convertGetRequestParams(data) {
    let str = '';
    // tslint:disable-next-line:forin
    for (const key in data) {
      if (str == '') {
        str += '?';
      }
      if (typeof data[key] != 'undefined') {
        // if (!isArray(data[key])) {
        //     str += key + '=' + encodeURIComponent(data[key]) + '&';
        // } else {
        typeof data[key] === 'object'
          ? (str += key + '=' + JSON.stringify(data[key]) + '&')
          : (str += key + '=' + data[key] + '&');
        // str += key + '=' + data[key] + '&';
        // }
      }
    }
    return str.substring(0, str.length - 1);
  }
}
