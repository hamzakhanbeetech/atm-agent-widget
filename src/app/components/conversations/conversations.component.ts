import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonService } from '../../services/common.service';
import { FuguWidgetService } from '../..//services/fuguWidget.service';
import { FayeService } from '../..//services/faye.service';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { trigger, state, style, transition, animate, keyframes, query, stagger, animateChild } from '@angular/animations';
import { MessageType, UserType, Typing, MessageStatus, NotificationType } from '../../enums/app.enums';

declare var moment: any;
declare var $: any;

@Component({
  selector: 'app-conversations',
  templateUrl: './conversations.component.html',
  styleUrls: ['./conversations.component.css'],
  animations: [
    trigger('fadeInCurtain', [
      transition('* => *', [ // each time the binding value changes
        query(':leave', [
          stagger(32, [
            animate('.2s ease', keyframes([
              style({ opacity: 1, offset: 0 }),
              style({ opacity: 0, offset: 1.0 })
            ]))

          ])
        ], { optional: true }),
        query(':enter', [
          style({ opacity: 0 }),
          stagger(50, [
            animate('.32s .16ms cubic-bezier(0.23, 1, 0.32, 1)', keyframes([
              style({ opacity: 0, transform: 'translateX(-8px)', offset: 0 }),
              style({ opacity: 1, transform: 'translateX(0)', offset: 1.0 })
            ]))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeOut', [
      transition(":leave", [
        style({ opacity: 1 }),
        animate('.2s ease', keyframes([
          style({ opacity: 1, maxHeight: '100%', offset: 0 }),
          style({ opacity: 0, maxHeight: '0', offset: 1.0 })
        ]))
      ])
    ])
  ]
})
export class ConversationsComponent implements OnInit, OnDestroy {
  private alive = true;
  public conversations: any = {};
  public showLoader = false;
  public MessageTypeEnum = MessageType;
  public UserTypeEnum = UserType;
  public MessageStatusEnum = MessageStatus;
  pageStart = 1;
  pageSize = 20;
  conv_end_bool = false;
  customerChatSub;
  agentChatSub;
  closedFromChat = false;
  firstHit = false;
  @ViewChild('scrollWidgetChatDiv') activeChatsContainer: ElementRef;
  SWIPE_ACTION = { LEFT: 'swipeleft', RIGHT: 'swiperight' };
  pos = 0;
  newIssue = 0;
  x: number = -1;
  y: number = -1;
  direction;
  lastY;
  isScrollServiceCallActive = false;
  errorMessage = 'Please try again.';
  showErrorMessage = false;
  constructor(public commonService: CommonService, private fuguWidgetService: FuguWidgetService, private router: Router,
    private fayeService: FayeService, private changeDetectorRef: ChangeDetectorRef, private route: ActivatedRoute) {
      this.route.params.subscribe(val => {
        if (val && val.closedFromChat) {
          this.closedFromChat = true;
        } else {
          this.closedFromChat = false;
        }
      });
  }
  ngOnInit() {
    console.log("conversation component loaded")
    this.showLoader = true;
    if (!this.closedFromChat && this.commonService.userDetails.access_token) {
      this.getConversations();
    }
    this.customerChatSub = this.commonService.customerChatClicked.subscribe(() => {
      this.openCustomerChats();
    });
    this.agentChatSub = this.commonService.openAgentConversations.subscribe(() => {
      this.openAgentChats();
    });
    this.fayeService.chatNonReassignEvent.takeWhile(() => this.alive).subscribe(data => this.onChatNonReassignEvent(data));
    window['conv'] = this;
  }
  openCustomerChats() {
    this.showLoader = true;
    this.conversations = {};
    this.pageSize = 20;
    this.pageStart = 1;
    this.conv_end_bool = false;
    this.firstHit = false;
    this.commonService.isCustomerChat = true;
    setTimeout(() => {
      this.activeChatsContainer.nativeElement.scrollTop = 0;
    }, 100);
    // tslint:disable-next-line:max-line-length
    this.fuguWidgetService.fuguWidgetData.customer_info = this.fuguWidgetService.fuguWidgetData.customer_info ? this.fuguWidgetService.fuguWidgetData.customer_info : {};
    // reseller putuser to get userid of customer
    if (!this.fuguWidgetService.fuguWidgetData.is_fork) {
      this.fuguWidgetService.putUserDetailsReseller(this.commonService.putUserDataForCustomer(), true)
        .takeWhile(() => this.alive)
        .subscribe(response => {
          // getConversation
          this.showErrorMessage = false;
          this.commonService.userDetails.customer_id = response.data.user_id;
          this.commonService.userDetails.searched_full_name = response.data.full_name;
          this.getConversations();
        }, error => {
          this.showLoader = false;
          this.showErrorMessage = true;
        });
    } else {
      this.fuguWidgetService.putUserDetails(this.commonService.putUserDataForCustomer())
        .takeWhile(() => this.alive)
        .subscribe(response => {
          // getConversation
          this.showErrorMessage = false;
          this.commonService.userDetails.customer_id = response.data.user_id;
          this.commonService.userDetails.searched_full_name = response.data.full_name;
          this.getConversations();
        }, error => {
          this.showLoader = false;
          this.showErrorMessage = true;
        });
    }
  }
  openAgentChats() {
    this.showLoader = true;
    this.conversations = {};
    this.pageSize = 20;
    this.pageStart = 1;
    this.conv_end_bool = false;
    this.firstHit = false;
    this.commonService.isCustomerChat = false;
    setTimeout(() => {
      this.activeChatsContainer.nativeElement.scrollTop = 0;
    }, 100);
    this.getConversations();
  }
  getConversations() {
    let userId;
    if (this.commonService.isCustomerChat) {
      userId = this.commonService.userDetails.customer_id;
    } else {
      userId = '';
    }
    this.fuguWidgetService.getConversations(this.commonService.userDetails.access_token ,
      this.commonService.userDetails.en_user_id , userId, this.pageStart)
      .takeWhile(() => this.alive)
      .subscribe(response => {
          this.showErrorMessage = false;
          try {
            this.pageSize = response.data.page_size;
            let conversations = response.data.conversation_list;
            if (!conversations.length) {
              this.conv_end_bool = true;
            }
            let count = 0;
            // conversations = conversations.filter((conversation) => {
            //   return ( (conversation.unread_count) || (conversation.agent_id == -1) ||
            //   (conversation.agent_id == this.commonService.userDetails.user_id) );
            // });
            if (conversations && conversations.length) {
              for (let i = 0; i < conversations.length; i++) {
                conversations[i].unique_id = conversations[i].channel_id;
                conversations[i].date_time = conversations[i].last_updated_at;
                this.conversations[conversations[i].channel_id] = conversations[i];
                if (i > 0 && conversations[i].unread_count) {
                  count += conversations[i].unread_count;
                }
              }
              // this.conversations = JSON.parse(JSON.stringify(this.conversations));
              this.conversations = {...this.conversations};
              if (conversations.length == 1) {
                this.commonService.showBackButton = false;
                this.commonService.recalculateUnreadCount(conversations[0].channel_id);
                this.router.navigate([`chat/${conversations[0].channel_id}`]);
              } else if (conversations.length > 1) {
                this.commonService.showBackButton = true;
              }
            }
            this.firstHit = true;
            if (Object.keys(this.conversations).length == 0) {
              if (this.commonService.isCustomerChat) {
                this.router.navigate(['/chat/-1'], { queryParams: { customer_id: userId }});
              }
            }
          } catch (e) {
            console.log(e);
          }
          finally {
            this.showLoader = false;
          }
        },
        error => {
          error = error.json();
          console.log(error);
          this.showLoader = false;
          this.showErrorMessage = true;
        });
  }
  scrollServiceCall() {
    // set scroll service call to true as as to avoid multiple calls to service
    this.isScrollServiceCallActive = true;
    this.showLoader = true;
    let userId;
    if (this.commonService.isCustomerChat) {
      userId = this.commonService.userDetails.customer_id;
    } else {
      userId = '';
    }
    this.fuguWidgetService.getConversations(this.commonService.userDetails.access_token,
      this.commonService.userDetails.en_user_id, userId, this.pageStart )
      .takeWhile(() => this.alive)
      .subscribe(
        response => {
          try {
            this.pageSize = response.data.page_size;
            let conversations = response.data.conversation_list;
            if (!conversations.length) {
              this.conv_end_bool = true;
            }
            let count = 0;
            // conversations = conversations.filter((conversation) => {
            //   return ( (conversation.unread_count) || (conversation.agent_id == -1) ||
            //   (conversation.agent_id == this.commonService.userDetails.user_id) );
            // });
            if (conversations && conversations.length) {
              for (let i = 0; i < conversations.length; i++) {
                conversations[i].unique_id = conversations[i].channel_id;
                conversations[i].date_time = conversations[i].last_updated_at;
                this.conversations[conversations[i].channel_id] = conversations[i];
                if (i > 0 && conversations[i].unread_count) {
                  count += conversations[i].unread_count;
                }
              }
              // this.conversations = JSON.parse(JSON.stringify(this.conversations));
              this.conversations = {...this.conversations};
            }
            this.isScrollServiceCallActive = false;
          } catch (e) {
            console.log(e);
          }
          this.showLoader = false;
        },
        error => {
          this.showLoader = false;
          this.isScrollServiceCallActive = false;
        }
      );
  }
  onScroll(e) {
    if ((e.target.scrollTop + e.target.clientHeight) / e.target.scrollHeight >= 0.9 &&
    !this.conv_end_bool && this.firstHit && !this.isScrollServiceCallActive) {
      this.pageStart += this.pageSize;
      this.scrollServiceCall();
    }
  }
  oncrossClick() {
    this.commonService.postMessageToParentWindow({ type: 'Collapse', data: {} });
  }

  disableScroll(e: MouseWheelEvent, el) {
    if (e.deltaY <= 0 && el.scrollTop == 0) {
      e.stopPropagation();
      e.preventDefault();
      this.pos = 0;
      this.newIssue = 0;
    }
    else if (e.deltaY >= 0 && el.scrollTop == el.scrollHeight - el.offsetHeight) {
      e.stopPropagation();
      e.preventDefault();
      this.pos = 0;
      this.newIssue = 0;
    }
  }
  touchDirection(event, el) {
    let e = event.e;
    if (event.direction == "up" && el.scrollTop == 0) {
      e.stopPropagation();
      e.preventDefault();
      this.pos = 0;
      this.newIssue = 0;
    }
    else if (event.direction == "down" && el.scrollTop == el.scrollHeight - el.offsetHeight) {
      e.stopPropagation();
      e.preventDefault();
      this.pos = 0;
      this.newIssue = 0;
    }
  }
  onTouchEnd(e: TouchEvent, el) {
    // let touch = e.touches[0];
    // let str;
    // if (touch.pageY - this.y >= 0)
    //   str = "down";
    // else if (touch.pageY - this.y <= 0)
    //   str = "up"
    // this.y = touch.pageY;
    // if (str == "up" && el.scrollTop == 0) {
    //   console.log("old")
    //   e.stopPropagation();
    //   e.preventDefault();
    //   this.pos = 0;
    //   this.newIssue = 0;
    // }
    // else if (str == "down" && el.scrollTop == el.scrollHeight - el.offsetHeight) {
    //   console.log("new")
    //   e.stopPropagation();
    //   e.preventDefault();
    //   this.pos = 0;
    //   this.newIssue = 0;
    // }
  }
  private onChatNonReassignEvent(newChatData) {
    if (newChatData.notification_type == NotificationType.Read_All) {
      // read all event -- unreadCount of channel and all customer involved in it to be 0
      this.commonService.recalculateUnreadCount(newChatData.channel_id);
      if (this.conversations[newChatData.channel_id]) {
        this.conversations[newChatData.channel_id]['is_new_count'] = 0;
        this.conversations[newChatData.channel_id]['unread_count'] = 0;
        this.changeDetectorRef.detectChanges();
      }
      return;
    }
    if (newChatData.message_type == MessageType.Video_Call) {
      return;
    }
    if ([NotificationType.INRIDE_STATUS, NotificationType.User_Online_Status, NotificationType.CHANNEL_REFRESH_AGENT].includes(newChatData.notification_type)) {
      return;
    }
    if (!newChatData['last_updated_at']) {
      newChatData['last_updated_at'] = newChatData.date_time;
    }

    const channelId = newChatData.channel_id;
    const user_unique_key = newChatData.user_unique_key;
    if (newChatData.agent_id && typeof newChatData.agent_id === 'string') {
      newChatData.agent_id = parseInt(newChatData.agent_id);
    }
    if (newChatData.agent_id && newChatData.agent_id == null) {
      newChatData.agent_id = newChatData.assigned_to;
    }
    newChatData.status = 1;
    newChatData['last_updated_at'] = newChatData.date_time;
    newChatData.unique_id = channelId;
    // check if chat is already in list
    if (this.conversations[channelId]) {
      newChatData.unread_count = this.conversations[channelId].unread_count ? this.conversations[channelId].unread_count + 1 : 1;
      this.conversations[channelId] = newChatData;
    } else if (!this.commonService.isCustomerChat) {
      // add new chat only if agent's my chat widget was open
      newChatData.unread_count = 1;
      this.conversations[channelId] = newChatData;
    }
    if (newChatData.last_sent_by_id == this.commonService.userDetails.user_id) {
      // chat sent by same agent on other sources (hippo dashboard) should not add to unread count
      newChatData.unread_count = 0;
    } else {
      this.commonService.playNotificationSound('https://s3.amazonaws.com/circlein/fugu_bot/beep');
      this.commonService.updateAndEmitUnreadCountOnFaye(channelId, user_unique_key);
    }
    // if new chats get added
    this.conversations = {...this.conversations};
    this.changeDetectorRef.detectChanges();
  }

  newConversation() {
    this.router.navigate(['chat/-1'], { queryParams: { label_id: -1 }, skipLocationChange: true });
  }

  channelAcronym(channelName): string {
    if (channelName) {
      let arr = channelName.trim().split(" ");
      let str: string = arr[0][0] + (arr[1] ? arr[1][0] : "");
      return str;
    }
    return "";
  }

  onConversationClick(key: string) {
    let labelId: any;
    let channelId: any;
    let defaultMessage: any;
    labelId = this.conversations[key].label_id;
    channelId = +this.conversations[key].channel_id;
    defaultMessage = this.conversations[key].message;
    this.commonService.recalculateUnreadCount(channelId);
    this.router.navigate([`chat/${channelId}`]);
  }

  // action triggered when user swipes
  onswipedown(el, e) {
    if (el.scrollTop == 0) {
      e.srcEvent.stopPropagation()
      e.preventDefault();
      this.pos = 0;
      this.newIssue = 0;
    }
    // console.log("swipe down")
  }
  onswipeup(el, e) {
    if (el.scrollTop == el.scrollHeight - el.offsetHeight) {
      e.srcEvent.stopPropagation()
      e.preventDefault();
      this.pos = 0;
      this.newIssue = 0;
    }
    // console.log("swipe up")
  }

  ngOnDestroy() {
    this.customerChatSub.unsubscribe();
    this.agentChatSub.unsubscribe();
    this.unbindEvent();
    this.alive = false;
  }

  @HostListener('document:touchstart', ['$event'])
  onTouchStart(e: any): void {
    this.lastY = e.touches ? e.touches[0].pageY : e.pageY;
    // console.log("lastY", this.lastY);
  }

  onTouchMove(e, el) {
    var currentY = e.touches ? e.touches[0].pageY : e.pageY;
    //console.log(“CurY: “+currentY+” / LasY: “+lastY);
    if (Math.abs(currentY - this.lastY) < 15) { return; }
    if (currentY > this.lastY) {
      // console.log('down');
      this.direction = "down";
      if (el.scrollTop == 0) {
        e.stopPropagation()
        e.preventDefault();
        this.bindEvent();
        this.pos = 0;
        this.newIssue = 0;
      }
      else {

        // $('body').unbind('touchmove');
        this.unbindEvent();
      }
    } else {
      // console.log('up');
      this.direction = "up";
      if (el.scrollTop == el.scrollHeight - el.offsetHeight) {
        e.stopPropagation()
        e.preventDefault();
        this.pos = 0;
        this.newIssue = 0;
        e.stopImmediatePropagation();
        //$('body').bind('touchmove', function (e) { e.preventDefault() });
        this.bindEvent();
      }
      else {
        //  $('body').unbind('touchmove');
        this.unbindEvent();
      }
    }
  }

  bindEvent() {
    document.body.addEventListener("touchmove", this.fn);
  }
  fn(e) {
    e.preventDefault();
  }
  unbindEvent() {
    document.body.removeEventListener("touchmove", this.fn)
  }
}
