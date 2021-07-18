import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { FayeService } from '../../services/faye.service';
import { FuguWidgetService } from '../..//services/fuguWidget.service';
import { MessageType, UserType, Typing, MessageStatus, NotificationType, IntegrationTypes, ChatType } from '../../enums/app.enums';
import { trigger, state, style, transition, animate, keyframes, query } from '@angular/animations';
import { MessageContentComponent } from '../message-content/message-content.component';
import {Subscription} from 'rxjs/Subscription';
import {LayoutService} from '../../services/layout.service';

declare var moment: any;
declare var require: any;

interface Message {
  date_time: string,
  full_name: string,
  id?: number,
  message: string,
  message_status: number,
  message_type: number,
  user_id: number,
  user_type: number,
  image_url?: string,
  thumbnail_url?: string,
  state?: string,
  content_value: any,
  values: Array<any>,
  line_before_feedback: string,
  line_after_feedback_1: string,
  line_after_feedback_2: string,
  comment: string,
  is_rating_given: number,
  rating_given: number,
  total_rating: number,
  muid: any,
  default_action_id: any,
  custom_action?: any;
  integration_source?: any;
  selected_btn_id?: any;
  is_active?: any;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ transform: 'translateY(15px)', opacity: 0 }),
        animate('.32s .16ms cubic-bezier(0.23, 1, 0.32, 1)', keyframes([
          style({ opacity: 0, transform: 'translateY(15px)', offset: 0 }),
          style({ opacity: 1, transform: 'translateY(0)', offset: 1.0 })
        ]))]),
      transition(':leave', [
        style({ transform: 'translateY(0px)', opacity: 1 }),
        animate('.32s cubic-bezier(0.23, 1, 0.32, 1)', keyframes([
          style({ opacity: 1, transform: 'translateY(0)', offset: 0 }),
          style({ opacity: 0, transform: 'translateY(15px)', offset: 1.0 })
        ]))]),
    ]),
    trigger('typingSlideIn', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('100ms ease-in', style({ height: '20px', opacity: 1 })
        )]),
      transition(':leave', [
        style({ height: '20px', opacity: 0 }),
        animate('100ms ease-out', style({ height: 0 })
        )])
    ]),
    trigger(
      'scaleInOut', [
        transition(':enter', [
          style({ transform: 'scale(0)', opacity: 0 }),
          animate('0.3s 0.16s cubic-bezier(0.23, 1, 0.32, 1)', style({ transform: 'scale(1)', opacity: 1 }))
        ]),
        transition(':leave', [
          style({ transform: 'scale(1)', opacity: 1 }),
          animate('0.2s 0.16s ease-out', style({ transform: 'scale(0)', opacity: 0 }))
        ])
      ]
    ),
    trigger("fadeSlideInMessages", [
      transition('* => new', [
        query('.agent-message', [
          style({ opacity: 0, transform: 'translateX(-15px)' }),
          animate('.42s .16ms cubic-bezier(0.23, 1, 0.32, 1)', keyframes([
            style({ opacity: 0, transform: 'translateX(-15px)', offset: 0 }),
            style({ opacity: 1, transform: 'translateX(0)', offset: 1.0 })
          ]))
        ], { optional: true }),
        query('.user-message', [
          style({ opacity: 0, transform: 'translateX(15px)' }),
          animate('.42s .16ms cubic-bezier(0.23, 1, 0.32, 1)', keyframes([
            style({ opacity: 0, transform: 'translateX(15px)', offset: 0 }),
            style({ opacity: 1, transform: 'translateX(0)', offset: 1.0 })
          ]))
        ], { optional: true }),
      ]),
      transition('* => added', [
        query('.agent-message', [
          style({ opacity: 0, transform: 'translateY(15px)' }),
          animate('.32s .16ms ease', keyframes([
            style({ opacity: 0, transform: 'translateY(15px)', offset: 0 }),
            style({ opacity: 1, transform: 'translateY(0)', offset: 1.0 })
          ]))
        ], { optional: true }),
        query('.user-message', [
          style({ opacity: 0, transform: 'translateY(15px)' }),
          animate('.32s .16ms ease', keyframes([
            style({ opacity: 0, transform: 'translateY(15px)', offset: 0 }),
            style({ opacity: 1, transform: 'translateY(0)', offset: 1.0 })
          ]))
        ], { optional: true }),
      ])
    ])

  ]
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild("scroll") scrollDiv: ElementRef;
  @ViewChild('fileInput') private fileInput: ElementRef;
  public MessageTypeEnum = MessageType;
  public UserTypeEnum = UserType;
  public MessageStatusEnum = MessageStatus;
  public ChatTypeEnum = ChatType;
  alive = true;
  activeChannelId: number = -1;
  messages: Array<Message> = [];
  prevMessagesToSend: Array<Message> = [];
  labelHeader: string = "";
  errorMessage: string = "";
  showLoader: boolean = false;
  last_customer_time_index: number = 0;
  last_agent_time_index: number = 0;
  labelId: number = -1;
  customerId: number = -1;
  isUserTyping: boolean = false;
  isAgentTyping: boolean = false;
  isAgentTypingName: string = "";
  onSubscribe: any;
  isFayeConnected: boolean = true;
  messageToSend: string = "";
  isTypingTimer: any;
  hideBackBtn: boolean = false;
  pos = 0;
  newIssue = 0;
  direction;
  lastY;
  touchdevice;
  chatType;
  private uuidv4;
  businessNameToReplace = "JungleWorks";
  backgroundList: Array<any> = ["url('assets/img/texture.png')", "url('assets/img/texture-plane.png')", "url('assets/img/texture-plane-white.png')"];
  alignmentList: Array<any> = ['left', 'center', 'right'];
  default_message: string;
  userType = UserType;
  showButtonMessage: boolean = false;
  isBotReply = 0;
  componentInitialize: boolean = false;
  messages_dictionary = {};
  access_token: any = '';
  buttonFields: any = {};
  public IntegrationTypeEnum = IntegrationTypes;
  pageIndex = 1;
  pageSize = 0;
  fetchingOnScrollMessages = false;
  isAllMessagesFetched = false;
  messageSub;
  imageUploadSubscription: Subscription;
  file_uploading_text = false;
  mediaPlayerObject = {
    is_open: false,
    message_data: {}
  };
  conv_transaction_id;
  dropup_open = false;
  showFloatingBtn = false;
  showFloatingBtnLength = 0;
  replyDisabled = false;
  constructor(private router: Router, private activatedRoute: ActivatedRoute, public commonService: CommonService,
    public fuguWidgetService: FuguWidgetService, private fayeService: FayeService, private ngZone: NgZone,
              private layoutService: LayoutService, private cdRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    window['chat'] = this;
    // handling messages via post message
    this.commonService.newPostMessageReceived
      .takeWhile(() => this.alive)
      .subscribe((data) => {
      this.createFayePaymentRequest(data);
    });
    this.uuidv4 = require('uuid/v4');
    this.access_token = this.fuguWidgetService.fuguWidgetData.access_token;
    this.touchdevice = 'ontouchstart' in document.documentElement;
    this.labelHeader = this.commonService.userDetails.searched_full_name || this.commonService.userDetails.business_name;
    let bgType = Number(this.commonService.configData["background-color-theme"]) || 0;
    let alignType = Number(this.commonService.configData["typing-allignment"]) || 0;
    document.documentElement.style.setProperty('--background-url', this.backgroundList[bgType < this.backgroundList.length && bgType >= 0 ? bgType : 0]);
    document.documentElement.style.setProperty('--align-typing', this.alignmentList[alignType < this.alignmentList.length && alignType >= 0 ? alignType : 0]);
    this.activatedRoute.params.subscribe((params: Params) => {
      let channelId = +params["channelId"] || -1;
      this.activatedRoute.queryParams
        .subscribe(tParams => {
          // console.log('transaction_id', tParams);
          this.conv_transaction_id = +tParams['transaction_id'] || '';
        });
      this.hideBackBtn = true;
      if (channelId == -10 ) {
        this.showLoader = true;
      } else if (channelId < 0) {
        console.log("invalid channel id");
        this.activatedRoute.queryParams
          .subscribe(params => {
            // Defaults to 0 if no query param provided.
            this.customerId = +params['customer_id'] || -1;
            this.labelId = +params['label_id'] || -1;
            this.default_message = params['default_message'] || "";
            if (this.default_message)
              this.appendDefaultMessage()
          });
      } else {
        this.activeChannelId = channelId;
        this.layoutService.active_channel_object = {
          channel_id: this.activeChannelId
        };
        this.setupActiveChannelSubscription();
        this.showLoader = true;
        let publish_message: boolean = false;
        let publish_once: boolean = false;
        this.activatedRoute.queryParams
          .subscribe(params => {
            this.customerId = +params['customer_id'] || -1;
            publish_message = !!params['publish_message'];
            publish_once = !!params['publish_once'];
          });
        this.refreshData(channelId, publish_message, publish_once);
      }
    });
    /**
     * emitter after image is uploaded in background in common service, if channel is still the same we append the message
     */
    this.layoutService.uploadImageEmitter
      .takeWhile(() => this.alive)
      .subscribe((data) => {
        if (data) {
          data['index'] =  !this.messages.length ? 0 : this.messages.length - 1;
          this.appendMessage(data, true);
          if (this.activeChannelId != -1) {
            this.postMessageThroughFaye(data);
          }
        }
      });
    this.layoutService.uploadingTextEmitter
      .takeWhile(() => this.alive)
      .subscribe((bool) => {
        if (typeof bool != 'undefined') {
          this.file_uploading_text = bool;
          setTimeout(() => {
            this.scrollToBottom();
          }, 0);
        }
      });
  }
  savePrevMessagesToSend() {
    this.prevMessagesToSend = [];
    for (let i = this.messages.length - 1; i >= 0 ; i--) {
      if (this.messages[i].message_status == this.MessageStatusEnum.Sending) {
        this.prevMessagesToSend.push(this.messages[i]);
      }
      else {
        break;
      }
    }
  }
  sendPrevMessages() {
    for (let i = this.prevMessagesToSend.length - 1; i >= 0 ; i--) {
      if (this.prevMessagesToSend[i].message_status == this.MessageStatusEnum.Sending) {
        this.messageToSend = this.prevMessagesToSend[i].message;
        this.onSendClick();
      }
      else {
        break;
      }
    }
    this.prevMessagesToSend = [];
  }

  refreshData(channelId, publish_message, publish_once, pageStart = 1) {
    this.savePrevMessagesToSend();
    if (channelId < 0) {
      return;
    }
    if (this.messageSub) {
      this.messageSub.unsubscribe();
      this.showLoader = false;
    }
    this.showLoader = true;
    if (pageStart == 1) {
      this.messages = [];
    }
    const obj = {
      channelId: channelId,
      page_start: pageStart,
      user_id: this.commonService.userDetails.en_user_id,
      access_token: this.commonService.userDetails.access_token
    };
    this.messageSub = this.fuguWidgetService.getMessages(obj)
      .takeWhile(() => this.alive)
      .subscribe(response => {
          try {
            this.messages = [...<Array<Message>>(response.data.messages), ...this.messages];
            this.showFloatingBtnLength += response.data.messages.length;
            this.replyDisabled = response.data.disable_reply;
            if (obj.page_start == 1) {
              this.messages_dictionary = {};
            }
            this.pageSize = response.data.page_size;
            if (response.data.messages.length < this.pageSize) {
              this.isAllMessagesFetched = true;
            }
            this.fetchingOnScrollMessages = false;
            /***
             * creating map of muid's to check for repeating messages.
             */
            response.data.messages.map((item) => {
              if (item.muid) {
                this.messages_dictionary[item.muid] = true;
              }
            });
            this.chatType = response.data.chat_type;
            // dynaic label
            const dynamicBusinessName = this.fuguWidgetService.fuguWidgetData.businessName;
            if (dynamicBusinessName && response.data.label == this.businessNameToReplace) {
              // relace business name woth dynamic business name
              response.data.label = dynamicBusinessName;
            }

            this.labelHeader =  response.data.label || this.commonService.userDetails.searched_full_name;
            if (publish_message) {
              if (this.messages.length) {
                if (!publish_once) {
                  this.sendDefaultMessage();
                }
              } else {
                this.sendDefaultMessage();
              }

            }
            /**
            * scroll is from top to prevent scroll top reaching on adding new messages
            * on pagination we move the scroll to 1.
            */
            if (obj.page_start != 1) {
              try {
                this.scrollDiv.nativeElement.scrollTo(0, 1);
              } catch (error) {
                console.log(error);
              }
            } else {
              setTimeout(() => {
                this.scrollToBottom();
              }, 100);
            }
            this.calculateTimeIndexes();

            this.sendPrevMessages();

          } catch (e) {
            this.errorMessage = e.message;
          }
          finally {
            this.showLoader = false;
            this.componentInitialize = true;
          }
        },
        error => {
          this.componentInitialize = true;
          error = error.json();
          console.log(error);
          this.errorMessage = error.message;
          this.showLoader = false;
        });
  }
  onMessagesScroll() {
    if (this.scrollDiv.nativeElement.scrollTop <
      this.scrollDiv.nativeElement.scrollHeight - this.scrollDiv.nativeElement.offsetHeight - 30) {
      if (!this.showFloatingBtn) {
        this.showFloatingBtn = true;
        this.showFloatingBtnLength = this.messages.length;
        this.cdRef.detectChanges();
      }
    } else {
      if (this.showFloatingBtn) {
        this.showFloatingBtn = false;
        this.showFloatingBtnLength = this.messages.length;
        this.cdRef.detectChanges();
      }
    }
    if (this.scrollDiv.nativeElement.scrollTop == 0) {
      if (!this.isAllMessagesFetched && !this.fetchingOnScrollMessages) {
        this.pageIndex = this.pageIndex + this.pageSize;
        this.fetchingOnScrollMessages = true;
        if (this.messageSub) {
          this.messageSub.unsubscribe();
        }
        this.refreshData(this.activeChannelId, false, false, this.pageIndex);
      }
    }
  }
  openImage(image_url) {
    this.commonService.postMessageToParentWindow({ type: "Image", data: image_url })
  }
  oncrossClick() {
    this.commonService.postMessageToParentWindow({ type: 'Collapse', data: {'closedFromChat': true} });
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

  replaceURLWithHTMLLinks(text)   /*function declaration for url only for messagetype=1 &3  */ {
    try {
      if (typeof text !== "string")
        return text;
      var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
      text = this.replacePhoneWithHTMLTel(text);
      return text.replace(exp, "<a target='_blank' href='$1'>$1</a>");
    }
    catch (e) {
      console.log(e);
      return text;
    }

  }

  replacePhoneWithHTMLTel(text)   /*function declaration for url only for messagetype=1 &3  */ {
    try {
      if (typeof text !== "string")
        return text;
      var exp = /(\+?(?:(?:9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)|\((?:9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\))[0-9. -]{4,14})(?:\b|x\d+)/ig;
      return text.replace(exp, "<a href='tel:$1'>$1</a>");
    }
    catch (e) {
      console.log(e)
      return text;
    }
  }

  modifyMessage_messageList(msg) {
    try {
      if (typeof msg !== "string")
        return msg;
      return msg.replace(new RegExp('\n', 'g'), "<br />")
    }
    catch (e) {
      return msg;
    }
  }

  backToConversations() {
    this.sendTypingStoppedEvent();
    this.fayeService.unsubscribeToActiveChannel();
    this.router.navigate(["conversations"], { skipLocationChange: true });
  }

  private scrollToBottom() {
    this.showFloatingBtnLength = this.messages.length;
    this.scrollDiv.nativeElement.scrollTop = this.scrollDiv.nativeElement.scrollHeight;
  }

  private calculateTimeIndexes() {
    let customer_found = false, agent_found = false;
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (customer_found && agent_found)
        break;
      if (this.messages[i].message_type != this.MessageTypeEnum.Activity_Message) {
        if (!customer_found && this.messages[i].user_type == this.UserTypeEnum.Customer) {
          customer_found = true;
          this.last_customer_time_index = i
        }
        if (!agent_found && this.messages[i].user_type == this.UserTypeEnum.Agent) {
          agent_found = true;
          this.last_agent_time_index = i
        }
      }
    }
  }

  onSendClick() {
    if (this.showLoader) {
      return;
    }
    if (this.activeChannelId == -1 && this.labelId == -1) {
      //case for new message
      let msg = this.createMessageToAppendInMessages();
      if (msg) {
        this.appendMessage(msg, true);
        let fayeMsg = this.createFayeMessageToSend();
        this.createNewConversation(fayeMsg);
      }
    }
    else if (this.activeChannelId != -1) {
      // case for active channel maessage
      //send message through faye
      let msg = this.createMessageToAppendInMessages();
      if (msg) {
        this.appendMessage(msg, true);
        let fayeMsg = this.createFayeMessageToSend();
        this.postMessageThroughFaye(fayeMsg);
      }
    }
    else {
      //case for new channel message
      let msg = this.createMessageToAppendInMessages();
      if (msg) {
        this.appendMessage(msg, true);
        let fayeMsg = this.createFayeMessageToSend();
        this.createNewConversation(fayeMsg);
      }
    }
    let textAreas = document.getElementsByTagName('textarea');
    for (let i = 0; i < textAreas.length; i++) {
      textAreas[i].style.height = '18px';
    }
    this.messageToSend = "";
  }

  private createFayeMessageToSend() {
    let newMessage = this.messageToSend.trim();
    if (!newMessage) return "";

    let now = moment().utc().format();
    now = now.replace("Z", ".000Z")
    let data = {
      message: newMessage,
      full_name: this.commonService.userDetails.full_name,
      user_id: this.commonService.userDetails.user_id,
      date_time: now,
      is_typing: Typing.Typing_End,
      message_type: MessageType.Customer_Agent_Message,
      user_type: UserType.Customer,
      message_status: MessageStatus.Sending,
      index: !this.messages.length ? 0 : this.messages.length - 1,
      is_bot_reply: this.isBotReply
    }
    this.isBotReply = 0;
    return data;
  }

  private createMessageToAppendInMessages() {
    let newMessage = this.messageToSend.trim();
    if (!newMessage) return "";

    let now = moment().utc().format();
    now = now.replace("Z", ".000Z")
    let data = {
      message: newMessage,
      full_name: this.commonService.userDetails.full_name,
      user_id: this.commonService.userDetails.user_id,
      date_time: now,
      message_type: MessageType.Customer_Agent_Message,
      message_status: MessageStatus.Sending,
      image_url: "",
      thumbnail_url: "",
      user_type: UserType.Customer
    }
    return data;
  }

  private sendDefaultMessage() {
    let newMessage = this.commonService.defaultMessageToPublish.trim();
    if (!newMessage) return "";

    let now = moment().utc().format();
    now = now.replace("Z", ".000Z")
    let data = {
      message: newMessage,
      full_name: this.commonService.userDetails.full_name,
      user_id: this.commonService.userDetails.user_id,
      date_time: now,
      message_type: MessageType.Customer_Agent_Message,
      message_status: MessageStatus.Sending,
      image_url: "",
      thumbnail_url: "",
      user_type: UserType.Customer,
      skip_bot: 1
    }
    this.appendMessage(data, true);

    let faye_data = {
      message: newMessage,
      full_name: this.commonService.userDetails.full_name,
      user_id: this.commonService.userDetails.user_id,
      date_time: now,
      is_typing: Typing.Typing_End,
      message_type: MessageType.Customer_Agent_Message,
      user_type: UserType.Customer,
      message_status: MessageStatus.Sending,
      index: !this.messages.length ? 0 : this.messages.length - 1,
      skip_bot: 1
    }
    this.postMessageThroughFaye(faye_data);
  }

  private postMessageThroughFaye(fayeMessage) {
    const muid = this.uuidv4();
    fayeMessage['muid'] = muid;
    this.messages_dictionary[muid] = true;
    this.fayeService.sendMessage(fayeMessage);
    if (!this.commonService.isConversationListValid && this.messages.length) {
      this.commonService.isConversationListValid = true;
    }
  }

  createNewConversation(fayeMessageToSend) {
    const obj = {
      access_token: this.commonService.userDetails.access_token,
      initiator_en_agent_id: this.commonService.userDetails.en_user_id,
      user_id: this.customerId,
      chat_type: 0,
    }
    this.fuguWidgetService.adminToUserChat(obj)
      .takeWhile(() => this.alive)
      .subscribe(response => {
        this.activeChannelId = response.data.channel_id;
          this.layoutService.active_channel_object = {
            channel_id: this.activeChannelId
          };
          if (this.alive) {
          this.setupActiveChannelSubscription();
          this.postMessageThroughFaye(fayeMessageToSend);
        }
      },
        error => {
          console.log("create new conversation error");
        })
  }

  setupActiveChannelSubscription() {
    this.fayeService.subscribeToChannel(this.activeChannelId);
    //faye event subscriptions
    this.fayeService.chatNonReassignEvent.takeWhile(() => this.alive).subscribe(data => this.onChatNonReassignEvent(data))
    this.fayeService.activeChannelIdMessageEvent.takeWhile(() => this.alive).subscribe(data => this.onActiveChannelIdMessageEvent(data))
    this.fayeService.activeChannelIdTypingEvent.takeWhile(() => this.alive).subscribe(data => this.onActiveChannelIdTypingEvent(data))
    this.fayeService.activeChannelIdMessageSentEvent.takeWhile(() => this.alive).subscribe(data => this.onActiveChannelIdMessageSentEvent(data))
    this.fayeService.readAllEvent.takeWhile(() => this.alive).subscribe(data => this.onReadAllEvent(data))
    this.fayeService.messageDeliveredEvent.takeWhile(() => this.alive).subscribe(data => this. onMessageDeliveredEvent(data));
    this.fayeService.messageReadEvent.takeWhile(() => this.alive).subscribe(data => this.onMessageReadEvent(data));
    this.fayeService.fayeConnectionEvent.takeWhile(() => this.alive).subscribe(data => this.onFayeConnectDisconnectEvent(data));
  }

  onChatNonReassignEvent(data) {
    // send unread count for channelid != currentChannelId
    if (data.notification_type == NotificationType.Read_All) {
      // read all event -- unreadCount of channel and all customer involved in it to be 0
      this.commonService.recalculateUnreadCount(data.channel_id);
      return;
    }
    if ([NotificationType.INRIDE_STATUS, NotificationType.User_Online_Status, NotificationType.CHANNEL_REFRESH_AGENT].includes(data.notification_type)) {
      return;
    }
    if ( data.channel_id != this.activeChannelId) {
      if (data.message_type == MessageType.Video_Call) {
        return;
      }
      if (data.last_sent_by_id != this.commonService.userDetails.user_id) {
        // chat sent by same agent on other sources (hippo dashboard) should not add to unread count
        this.commonService.updateAndEmitUnreadCountOnFaye(data.channel_id, data.user_unique_key);
        this.commonService.playNotificationSound('https://s3.amazonaws.com/circlein/fugu_bot/beep');
      }
    } else {
      switch (data.message_type) {
        case MessageType.Custom_Action_Message:
          this.appendNewFayeMessage(data);
          break;
        case MessageType.Form_Message:
          this.buttonFields = {};
          this.appendNewFayeMessage(data);
          break;
        case MessageType.Feedback_Message:
          this.appendNewFayeMessage(data);
          this.setFormType();
          break;
        default:
          break;
      }
    }
  }
  appendNewFayeMessage(data) {
    // donot scroll on new msg if he is not at bottom
    if (this.showFloatingBtn) {
      this.appendMessage(data, false);
    } else {
      this.appendMessage(data, true);
    }
  }
  setFormType() {
    setTimeout(() => {
      if (this.buttonFields && this.buttonFields.content_value) {
        this.selectFormType(this.buttonFields.default_action_id, "");
      }
    });
  }

  onActiveChannelIdMessageEvent(data) {
    if ([NotificationType.CHANNEL_REFRESH_AGENT].includes(data.notification_type)) {
      return;
    }
    if (data.notification_type == NotificationType.Channel_Refresh) {
      this.replyDisabled = data && data.disable_reply || 0;
      return;
    }
    switch (data.message_type) {
      case this.MessageTypeEnum.Bot_Text_Message:
        this.appendNewFayeMessage(data);
        this.setFormType();
        break;
      default:
        this.ngZone.run(() => {
          if ([MessageType.Form_Message, MessageType.Feedback_Message].includes(data.message_type)) {
            return;
          }
          if (((data.message != '' || data.thumbnail_url != '') && (data.on_subscribe != 0 && data.on_subscribe != 1) &&
              ((data.muid && !this.messages_dictionary[data.muid]) || !data.muid) && data.message_type != MessageType.Custom_Action_Message)
               || data.message_type == MessageType.Payment_Message) {
            //if (data.user_id == self.commonService.loginData.user_id || data.user_id == self.activeUserDetails.user_id){
            //now message will NOT be appened by FAYE. but read/ unread receipt will be updated by FAYE

            // if (data.user_id != this.commonService.loginData.user_id && this.activeChannelId == data.channel_id) {
            // if (data.user_id != this.commonService.userDetails.user_id) {
              // event sent by user or another agaent
              if (data.user_id == this.commonService.userDetails.user_id) {
                // case when my sent message comes back on active channel, mark it as sent
                data.message_status = this.MessageStatusEnum.Sent;
              }
              this.appendNewFayeMessage(data);
              this.setFormType();
              //send read response as the agent has already opened the current chat
              let now = moment().utc().format();
              now = now.replace("Z", ".000Z")
              let d = {
                user_id: +this.commonService.userDetails.user_id,
                channel_id: this.activeChannelId,
                // read_at: now,
                notification_type: NotificationType.Read_All,
                user_type: UserType.Agent,
                // read_all: true
                // delivered_at: now
              }
              this.fayeService.sendAck_Read(d);
            // }
          } else if (data.message_type == MessageType.Custom_Action_Message &&
              this.messages_dictionary[data.muid] && data.selected_btn_id) {
              for (let i = 0; i < this.messages.length; i++) {
                if (this.messages[i].muid == data.muid) {
                  // this.messages[i] = Object.assign(this.messages[i], data);
                  if (data.content_value) {
                    this.messages[i].content_value = data.content_value;
                  }
                  this.messages[i].selected_btn_id = data.selected_btn_id;
                  this.messages[i].is_active = data.is_active;
                  break;
                }
              }
          }

          if (data.user_id != this.commonService.userDetails.user_id && data.message == "" && (data.on_subscribe == 1 || data.on_subscribe == 0)) {
            this.onSubscribe = data.on_subscribe;
            if (data.on_subscribe == 1) {
              this.setMessageStatuses(3);
            }
          }
        });
    }

  }

  onActiveChannelIdTypingEvent(data) {
    this.ngZone.run(() => {
      if (data.is_typing == Typing.Typing_Start && data.user_id != this.commonService.userDetails.user_id) {
        if (data.user_type == UserType.Agent) {
          // this is actually customer
          this.isUserTyping = true;
        } else if (data.user_type == UserType.Customer) {
          // this is actually agent
          if (this.chatType == ChatType.AdminToAdmin) {
            this.isUserTyping = true;
            this.isAgentTypingName = data.full_name;
          } else {
            this.isAgentTyping = true;
            this.isAgentTypingName = data.full_name;
          }
        }
        // this.scrollToBottom();
      } else if (data.is_typing == Typing.Typing_Stopped && data.user_id != this.commonService.userDetails.user_id) {
        if (data.user_type == UserType.Agent) {
          // this is actually customer
          this.isUserTyping = false;
        } else if (data.user_type == UserType.Customer) {
          // this is actually agent
          if (this.chatType == ChatType.AdminToAdmin) {
            this.isUserTyping = false;
            this.isAgentTypingName = '';
          } else {
            this.isAgentTyping = false;
            this.isAgentTypingName = '';
          }
        }
        // this.scrollToBottom();
      }
      // setTimeout(() => {
      //   this.scrollToBottom();
      // }, 0);
    });
  }

  onActiveChannelIdMessageSentEvent(data) {
    this.ngZone.run(() => {
      if (data.index != -1) {
        // this.buttonFields = {};
        this.messages[data.index].message_status = MessageStatus.Sent;
        let now = moment().utc().format();
        now = now.replace("Z", ".000Z");
        this.messages[data.index].date_time = now;
        this.setFormType();
      }
    });
  }

  onReadAllEvent(data) {
    this.ngZone.run(() => {
      if (this.commonService.userDetails.user_id != data.user_id) {
        // console.log("read by agent")
        for (let i = 0; i < this.messages.length; i++) {
          if (this.messages[i].user_type == UserType.Customer) {
            this.messages[i].message_status = MessageStatus.Read;
          }
        }
        this.messages[this.messages.length - 1].message_status = MessageStatus.Read;
        let now = moment().utc().format();
        now = now.replace("Z", ".000Z")
        this.messages[this.messages.length - 1].date_time = now;
      }
      // this.messages[this.messages.length - 1].message_status = MessageStatus.Read;
    });
  }

  onMessageDeliveredEvent(data) {
    /*
    * uncomment when everyone has merged.
    *
    //check if user/customer chat has read or not?
    if (this.chatUsersList[data.channel_id].user_id == data.user_id) {
        console.log("delivered to user")
        this.messages[this.messages.length - 1].message_status = MessageStatus.Delivered;
    }
    */
    //--remove line when above part is uncommented
    this.messages[this.messages.length - 1].message_status = MessageStatus.Delivered;
    //--
  }

  onMessageReadEvent(data) {
    this.ngZone.run(() => {
      /*
      * uncomment when everyone has merged.
      */
      //check if user/customer chat has read or not?
      if (this.commonService.userDetails.user_id != data.user_id) {
        // console.log("read by agent")
        this.messages[this.messages.length - 1].message_status = MessageStatus.Read;
        let now = moment().utc().format();
        now = now.replace("Z", ".000Z")
        this.messages[this.messages.length - 1].date_time = now;
      }


      // //--remove line when above part is uncommented
      // this.messages[this.messages.length - 1].message_status = MessageStatus.Read;
      // let now = moment().utc().format();
      // now = now.replace("Z", ".000Z")
      // this.messages[this.messages.length - 1].date_time = now;
      // //--
    });
  }

  onFayeConnectDisconnectEvent(e: boolean) {
    const connection = e ? 'connected' : 'disconnected';
    // alert(connection);
    this.isFayeConnected = e;
    // alert(connection + (this.componentInitialize ? ' initialized' : ' not initialized'));
    if (this.isFayeConnected && this.componentInitialize) {
      this.refreshData(this.activeChannelId , false , false);
    }
  }

  private setMessageStatuses(messageStatus) {
    for (var i = 0; i < this.messages.length; i++) {
      this.messages[i].message_status = messageStatus;
    }
  }

  private appendMessage(data, scroll_to_bottom?): void {
    if (!data.message.toString().trim() && ![MessageType.Image_Message,
      MessageType.File_Message, MessageType.Payment_Message].includes(data.message_type)) {
      console.log('invalid message: ', data);
      return;
    } else if (data.message_type == this.MessageTypeEnum.Image_Message && !data.image_url.toString().trim()) {
      console.log('invalid message: ', data);
      return;
    } else if (data.message_type == this.MessageTypeEnum.File_Message && !data.url.toString().trim()) {
      console.log('invalid message: ', data);
      return;
    }

    let msgStatus = data.message_status;
    msgStatus = ((msgStatus === undefined) ||
      (msgStatus == MessageStatus.Sending && data.user_id != this.commonService.userDetails.user_id)) ?
      MessageStatus.Sent : msgStatus;
    this.isUserTyping = false;
    this.isAgentTyping = false;
    // this.messages.push({
    //   'full_name': data.full_name,
    //   'message': data.message,
    //   'user_id': data.user_id,
    //   'date_time': data.date_time,
    //   'message_type': data.message_type,
    //   'user_type': data.user_id ? data.user_type : UserType.Bot,
    //   'message_status': msgStatus,
    //   'image_url': data.image_url,
    //   'thumbnail_url': data.thumbnail_url,
    //   'state': 'added',
    //   'content_value': data.content_value || null,
    //   'values': data.values || [],
    //   'id': data.id,
    //   "line_before_feedback": data.line_before_feedback,
    //   "line_after_feedback_1": data.line_after_feedback_1,
    //   "line_after_feedback_2": data.line_after_feedback_2,
    //   "comment": data.comment,
    //   "is_rating_given": data.is_rating_given,
    //   "rating_given": data.rating_given,
    //   "total_rating": data.total_rating,
    //   "muid": data.muid,
    //   "default_action_id": data.default_action_id || null
    // });
    this.pageIndex = this.pageIndex + 1;
    if (data.muid && this.messages_dictionary[data.muid]) {
      for (let i = 0; i < this.messages.length; i++) {
        if (this.messages[i].muid == data.muid) {
          this.messages[i] = Object.assign(data, {'state': 'added', 'message_status': msgStatus,
          'user_type': data.user_id ? data.user_type : UserType.Bot});
          break;
        }
      }
    } else {
      this.messages.push(Object.assign(data, {'state': 'added', 'message_status': msgStatus,
      'user_type': data.user_id ? data.user_type : UserType.Bot}));
    }
    if (data.muid) {
      this.messages_dictionary[data.muid] = true;
    }
    if (data.message_type != this.MessageTypeEnum.Activity_Message) {
      if (data.user_type == this.UserTypeEnum.Agent)
        this.last_agent_time_index = this.messages.length - 1;
      else
        this.last_customer_time_index = this.messages.length - 1;
    }
    if (scroll_to_bottom) {
      this.showFloatingBtn = false;
      this.cdRef.detectChanges();
    }
    setTimeout(() => {
      if (scroll_to_bottom) {
        this.scrollToBottom();
      }
    }, 0);
  }

  private detectTyping(): boolean {
    let returnValue = this.isUserTyping;
    if (!this.isUserTyping) {
      // this.isUserTyping = true;
    }
    else {
      if (this.isTypingTimer)
        clearTimeout(this.isTypingTimer);
    }
    this.isTypingTimer = setTimeout(() => {
      this.isUserTyping = false;
      this.sendTypingStoppedEvent();
    }, 4000);
    return returnValue;
  }
  onTextarea_keydown(e: KeyboardEvent) {
    if (!this.commonService.iPadState) {
      this.commonService.iPadState = true;
      this.commonService.postMessageToParentWindow({ type: "IosFix", data: true })

    }
    if (!e.shiftKey && e.keyCode == 13) {
      this.onSendClick();
      this.messageToSend = "";
      this.isUserTyping = false;
      return false;
    }
    else {
      let typingState = this.detectTyping();
      if (!typingState) {
        this.sendTypingStartEvent();
      }
    }
  }
  private sendTypingStartEvent() {
    let now = moment().utc().format();
    now = now.replace("Z", ".000Z")
    let data = {
      message: "",
      full_name: this.commonService.userDetails.full_name,
      user_id: this.commonService.userDetails.user_id,
      date_time: now,
      is_typing: Typing.Typing_Start,
      message_type: MessageType.Customer_Agent_Message,
      user_type: UserType.Customer,
      message_status: MessageStatus.Sending,
    }
    this.postMessageThroughFaye(data);
  }
  private sendTypingStoppedEvent() {
    let now = moment().utc().format();
    now = now.replace("Z", ".000Z")
    let data = {
      message: "",
      full_name: this.commonService.userDetails.full_name,
      user_id: this.commonService.userDetails.user_id,
      date_time: now,
      is_typing: Typing.Typing_Stopped,
      message_type: MessageType.Customer_Agent_Message,
      user_type: UserType.Customer,
      message_status: MessageStatus.Sending,
    }
    this.postMessageThroughFaye(data);
  }
  onAttchmentClick(fileControl) {
    fileControl.click();
    this.dropup_open = false;
  }
  prepareFilesForUpload(event) {
    for (let i = 0; i < event.target.files.length; i++) {
      this.filesUpload(event.target.files[i], i == event.target.files.length - 1);
    }
  }
  filesUpload(file, is_last_file) {
    this.layoutService.filesUpload(file, {
      channel_id: this.activeChannelId
    } , is_last_file);
  }

  @HostListener('document:touchstart', ['$event'])
  onTouchStart(e: any): void {
    this.lastY = e.touches ? e.touches[0].pageY : e.pageY;
    // console.log("lastY", this.lastY);
  }

  onTouchMove(e, el) {
    // console.log("touchmove E: ", e);
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
    e.preventDefault()
  }
  unbindEvent() {
    document.body.removeEventListener("touchmove", this.fn)
  }
  onTextAreaBlur(e) {
    this.commonService.iPadState = false;
    this.commonService.postMessageToParentWindow({ type: "IosFix", data: false })
  }

  onTextAreaFocus(e) {
    this.commonService.iPadState = true;
    this.commonService.postMessageToParentWindow({ type: "IosFix", data: true })
  }

  autoGrow(e: any) {
    var elm = e.target;
    elm.style.height = "10px";
    if (elm.scrollHeight < 100) {
      elm.style.height = (elm.scrollHeight) + "px";
    }
    else {
      elm.style.height = '100px';
    }
  }

  private appendDefaultMessage() {

    let now = moment().utc().format();
    now = now.replace("Z", ".000Z")
    this.messages.push({
      date_time: now,
      full_name: this.fuguWidgetService.fuguWidgetData.businessName,
      message: this.default_message,
      user_id: -1,
      user_type: UserType.Bot,
      message_status: MessageStatus.Read,
      message_type: MessageType.Customer_Agent_Message,
      content_value: null,
      values: [],
      id: null,
      line_before_feedback: '',
      line_after_feedback_1: '',
      line_after_feedback_2: '',
      comment: '',
      is_rating_given: 0,
      rating_given: 0,
      total_rating: 5,
      muid: null,
      default_action_id: null
    });
  }

  ngOnDestroy() {
    this.unbindEvent();
    this.alive = false;
    this.sendTypingStoppedEvent();
    this.fayeService.unsubscribeToActiveChannel();
    this.layoutService.active_channel_object = {
      channel_id: null
    };
  }

  selectFormType(action_id: any, button_title: string) {
    if (!action_id) {
      this.buttonFields = {};
      return;
    }
    let body = {
      message: this.buttonFields.message,
      message_id: this.buttonFields.id,
      values: action_id,
      index: !this.messages.length ? 0 : this.messages.length - 1,
      app_secret_key: this.fuguWidgetService.fuguWidgetData.appSecretKey,
      user_id: this.commonService.userDetails.user_id
    };
    this.postMessageThroughFaye(body);
    if (button_title.trim()) {
      this.messageToSend = button_title;
      this.isBotReply = 1;
      this.onSendClick();
    }
    this.buttonFields = {};
  }
  openPaymentRequestForm() {
    const winRef = window.open('/#/payment', '_blank', 'toolbar=yes,scrollbars=yes,resizable=yes,top=100,left=250,width=800,height=600');
    winRef['channel_id'] = JSON.parse(JSON.stringify(this.activeChannelId));
    winRef['widget_data'] = this.fuguWidgetService.fuguWidgetData;
  }

  createFayePaymentRequest(data) {
    console.log(data, this.activeChannelId);
    if (data.channel_id != this.activeChannelId) {
      return;
    }
    data.custom_action.transaction_id = this.conv_transaction_id;
    delete data.channel_id;
    let now = moment().utc().format();
    now = now.replace('Z', '.000Z');
    let obj = {
      message: '',
      full_name: this.commonService.userDetails.full_name,
      user_id: this.commonService.userDetails.user_id,
      date_time: now,
      is_typing: Typing.Typing_End,
      message_type: MessageType.Payment_Message,
      user_type: UserType.Customer,
      message_status: MessageStatus.Sending,
      index: !this.messages.length ? 0 : this.messages.length - 1,
      is_bot_reply: this.isBotReply
    };
    obj = Object.assign(obj, data);
    this.appendMessage(obj, true);
    this.postMessageThroughFaye(obj);
    if (this.activeChannelId == -1) {
      this.createNewConversation(obj);
    }
    console.log(obj);
  }
}
