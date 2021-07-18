import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  OnDestroy, ChangeDetectionStrategy, HostListener,
} from '@angular/core';

import { CommonService } from '../../services/common.service';
export enum KEY_CODE {
  ESC = 27,
  SPACE = 32
}
@Component({
  selector: 'app-media-player',
  templateUrl: './media-player.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./media-player.component.css']
})
export class MediaPlayerComponent implements OnInit, OnDestroy {
  supportedVideoPlayerExtensions = ['mp4', 'mov', 'ogg', 'webm'];
  @Input() messageData;
  @Output() closePlayer = new EventEmitter<boolean>();
  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {

    if (event.keyCode === KEY_CODE.ESC) {
      this.onCloseClick();
    }

    if (event.keyCode === KEY_CODE.SPACE) {
      this.playVideo(event);
    }
  }
  constructor(public commonService: CommonService) { }

  ngOnInit() {
    const split_extension = this.messageData.file_name.split('.');
    this.messageData['message_extension'] = split_extension[split_extension.length - 1].toLowerCase();
  }

  ngOnDestroy() {
    this.messageData = {};
  }

  onCloseClick() {
    this.closePlayer.emit(false);
  }
  playVideo(event) {
    event.stopPropagation();
    event.preventDefault();
    const currentVideo = <HTMLVideoElement>document.getElementById('video-player');
    if (currentVideo) {
      if (currentVideo.paused) {
        currentVideo.play();
      } else {
        currentVideo.pause();
      }
    }
  }
}
