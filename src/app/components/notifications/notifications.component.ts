import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FayeService } from '../../services/faye.service';
import { CommonService } from '../../services/common.service';
import { trigger, state, style, transition, animate, keyframes, query, stagger, animateChild } from '@angular/animations';

interface Notification {
  agentName: string,
  message: string,
  datetime: string,
  businessName: string
}

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('.42s .16ms cubic-bezier(0.23, 1, 0.32, 1)', keyframes([
          style({ opacity: 0, transform: 'translateX(100%)', offset: 0 }),
          style({ opacity: 1, transform: 'translateX(0)', offset: 1.0 })
        ]))]),
      transition(':leave', [
        style({ transform: 'translateY(0px)', opacity: 1 }),
        animate('.2s ease-out', keyframes([
          style({ opacity: 1, offset: 0 }),
          style({ opacity: 0, offset: 1.0 })
        ]))]),
    ])
  ]

})
export class NotificationsComponent implements OnInit, OnDestroy {
  alive: boolean = true;
  notifications: Array<Notification> = [];
  constructor(private fayeService: FayeService, private commonService: CommonService,private cd:ChangeDetectorRef) { }

  ngOnInit() {
    this.fayeService.chatNonReassignEvent
      .takeWhile(() => this.alive)
      .subscribe(data => this.onNotification(data));
    // let msg = {
    //   agent_name: "Gonick",
    //   message: "Hi, how are you?",
    //   daste_time: "",
    // }
    // setInterval(() => {
    //   this.onNotification(msg);
    // }, 5000)
    this.commonService.newConversationInitiated
      .takeWhile(() => this.alive).subscribe(response => {
        let msg = {
          agent_name: "",
          message: response.message,
          date_time: new Date().toJSON(),
        }
        this.onNotification(msg);
      })
  }

  onNotification(data) {
    let msg: Notification = {
      agentName: data.agent_name,
      message: data.message,
      datetime: data.date_time,
      businessName: this.commonService.userDetails.business_name
    }
    this.notifications.push(msg);
    this.commonService.postMessageToParentWindow({ type: "Notification", data: { count: this.notifications.length } })
    this.cd.detectChanges();
  }

  onClear() {
    this.notifications = [];
    this.commonService.postMessageToParentWindow({ type: "Collapse", data: {} });
  }

  onNotificationClick() {
    this.commonService.postMessageToParentWindow({ type: "Expand", data: {} });
  }

  ngOnDestroy() {
    this.alive = false;
  }

}
