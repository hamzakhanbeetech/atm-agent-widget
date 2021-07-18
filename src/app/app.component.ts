import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from './services/common.service';
import { FuguWidgetService } from './services/fuguWidget.service';
import { FayeService } from './services/faye.service';
import { ChatType } from './enums/app.enums';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  previousRoute: string;
  closedFromChat = false;
  debug = false;
  private _collpased: boolean = true;
  set collapsed(val: boolean) {
    this._collpased = val;
    if (val) {
      this.router.navigate(['conversations', {'closedFromChat' : this.closedFromChat}], {skipLocationChange: true});
    } else {
      // --test basis
      if (this.commonService.isConversationListValid) {
        this.router.navigate([this.previousRoute], { skipLocationChange: true });
      } else {
        this.router.navigate(['conversations'], {skipLocationChange: true});
      }
    }
  }
  get collapsed() {
    return this._collpased;
  }
  private alive: boolean = true;

  constructor(private router: Router, private commonService: CommonService, private fuguWidgetService: FuguWidgetService,
    private fayeService: FayeService) {
    this.previousRoute = 'conversations';
  }

  ngOnInit() {
    // get ip address
    this.fuguWidgetService.findIP()
      .takeWhile(() => this.alive)
      .subscribe((response) => {
        console.log('Your ip: ' + response.ip);
        this.commonService.ip = response.ip;
      },
        error => {
          console.log('get ip error');
        });

    ///get configurations event subs
    this.fuguWidgetService.configFetchEvent
      .takeWhile(() => this.alive)
      .subscribe(response => {
        this.commonService.updateConfigDetails(response.data);
        if (this.fuguWidgetService.fuguWidgetData.color) {
          response.data['color-theme'] = this.fuguWidgetService.fuguWidgetData.color;
        }
        this.commonService.postMessageToParentWindow({ type: "Config", data: response.data });
        document.documentElement.style.setProperty('--color', response.data["color-theme"]);
      });
    window['app'] = this;
  }

  @HostListener('window:message', ['$event'])
  onWindowOffline(e: any): void {
    if (e.data.type && e.origin == e.data.parent_origin) {
      this.commonService.parentOrigin = e.data.parent_origin;
      this.commonService.currentUrl = e.data.current_url;
      if (!environment.production || this.debug) {
        console.log('ng-App-Hostlistener: ', e);
      }
      switch (e.data.type) {
        case 'Expand':
          this.collapsed = false;
          break;
        case 'Collapse':
          if (e.data && e.data.data && e.data.data.closedFromChat) {
            // to prevent getConv hit when user click close from chat component
            this.closedFromChat = true;
          } else {
            this.closedFromChat = false;
          }
          this.collapsed = true;
          break;
        case "Init":
          this.fuguWidgetService.fuguWidgetData = e.data.data;
          this.commonService.hostname = e.data.hostname;
          if (this.fuguWidgetService.fuguWidgetData.customWhitelabelPointing) {
            // environment.api_url = 'https://f1-doppler.taxi-hawk.com/widget/api/'
            const url = new URL(this.commonService.currentUrl)
            environment.API_ENDPOINT =  url.origin + '/widget/api/';
            environment.FAYE_ENDPOINT =  url.origin + '/widget/faye';
          }
          if (this.fuguWidgetService.fuguWidgetData.is_fork) {
            this.initForkedAgentWidget();
          } else {
            this.initAgentWidget();
          }
          // this.checkArrowPosition(e.data);
          // this.agentLoginViaAuthToken();
          break;
        case "Shutdown":
          this.fayeService.unsubscribeAllSubscriptions(true);
          this.commonService.userLogout(e.data.data.hostname);
          break;
        case "StartConversation":
          this.createUniqueConversation(e.data.data.data || e.data.data);
          break;
        case 'StartPeerToPeerConversation':
          this.createPeerToPeerConversation(e.data.data.data || e.data.data);
          break;
        case "ConfigCompleted":
          this.commonService.postMessageToParentWindow({ type: "SetupComplete", data: {} });
          break;
        case "Blur":
          this.commonService.iPadState = false;
          break;
        case "BotMessage":
          this.newConversationWithBotMessage(e.data.data);
          break;
        case 'OpenConversation':
          this.fuguWidgetService.fuguWidgetData = {...this.fuguWidgetService.fuguWidgetData, ...e.data.data};
          this.commonService.postMessageToParentWindow({ type: 'Expand', data: {} });
          this.openCustomerConversation();
          break;
        case 'OpenMyConversation':
          this.commonService.postMessageToParentWindow({ type: 'Expand', data: {} });
          this.commonService.openAgentConversations.emit();
          break;
        case 'NewCustomerOnline':
          this.onNewCustomer(e.data.data);
          break;
        case 'StartOneToOneChat':
          this.startOneToOneChat(e.data.data.data);
          break;
        case 'StartChatWithCustomer':
          this.startChatWithCustomer(e.data.data.data);
          break;
      }
    }
  }

  createPeerToPeerConversation(convObj) {
    let startPeerConvObj: any = JSON.parse(JSON.stringify(convObj));
    startPeerConvObj.chat_type = ChatType.p2p;
    startPeerConvObj.en_user_id = this.commonService.userDetails.en_user_id;
    this.fuguWidgetService.createConversation(-1, this.commonService.userDetails.en_user_id, startPeerConvObj)
    .takeWhile(() => this.alive)
    .subscribe(response => {
      const channelId = response.data.channel_id;
      this.router.navigate([`chat/${channelId}`], { queryParams: { label_id: -1 }, skipLocationChange: true });
    }, error => {
      console.log("createConversation: ", error.json());
    });
  }
  startOneToOneChat(data) {
    if (data.user_id === undefined && data.email === undefined) {
      throw new Error('Neither email nor userid provided');
    }
    this.fuguWidgetService.createOneToOneChat(this.fuguWidgetService.fuguWidgetData.access_token, data)
    .subscribe(res => {
      const channelId = res.data.channel_id;
      this.router.navigate([`chat/${channelId}`], { queryParams: { label_id: -1 }, skipLocationChange: true });
    }, err => {
      console.log('createOneToOneChat Error: ', err.json());
    });
  }
  startChatWithCustomer(data) {
    if (data.customer_unique_keys === undefined) {
      throw new Error('No user id provided');
    }
    if (data.transaction_id === undefined) {
      throw new Error('No transaction id provided');
    }
    const obj = {
      access_token: this.commonService.userDetails.access_token,
      initiator_en_agent_id: this.commonService.userDetails.en_user_id,
      other_user_unique_key: data.customer_unique_keys,
      transaction_id: data.transaction_id,
      chat_type: 0,
    }
    if (data.custom_label) {
      obj['custom_label'] = data.custom_label;
    }
    this.fuguWidgetService.adminToUserChat(obj)
      .takeWhile(() => this.alive)
      .subscribe(response => {
        const channelId = response.data.channel_id;
        this.router.navigate([`chat/${channelId}`], { queryParams: { label_id: -1 }, skipLocationChange: true });
      },
        error => {
          console.log("create new conversation error");
        })
  }
  createUniqueConversation(convObj) {
    let startConvObj = JSON.parse(JSON.stringify(convObj));
    let agent_channel_label;
    if (startConvObj.custom_label) {
      agent_channel_label = startConvObj.custom_label;
    }
    else {
      agent_channel_label = this.commonService.userDetails.business_name;
    }
    if (!(startConvObj.transaction_id || this.commonService.userDetails.user_id) && startConvObj.defaultMessage) {
      //createConversation(startConvObj.defaultMessage);

      this.fuguWidgetService.createConversation(-1, this.commonService.userDetails.en_user_id, startConvObj)
        .takeWhile(() => this.alive)
        .subscribe(response => {
          let channelId = response.data.channel_id;
          this.router.navigate([`chat/${channelId}`], { queryParams: { label_id: -1 }, skipLocationChange: true });
        }, error => {
          console.log("createConversation: ", error.json())
        })
    }
    else if (startConvObj.transaction_id && this.commonService.userDetails.user_id) {

      this.fuguWidgetService.createConversation(-1, this.commonService.userDetails.en_user_id, startConvObj)
        .takeWhile(() => this.alive)
        .subscribe(response => {
          let channelId = response.data.channel_id;
          if (startConvObj.defaultMessage) {
            this.commonService.defaultMessageToPublish = startConvObj.defaultMessage;
            if (startConvObj.singleDefaultMessage)
              return this.router.navigate([`chat/${channelId}`],
                { queryParams: { label_id: -1, publish_message: true, publish_once: true }, skipLocationChange: true });
            else
              return this.router.navigate([`chat/${channelId}`], { queryParams: { label_id: -1, publish_message: true }, skipLocationChange: true });
          }
          return this.router.navigate([`chat/${channelId}`], { queryParams: { label_id: -1, publish_message: false }, skipLocationChange: true });
        }, error => {
          console.log("createConversation: ", error.json())
        })
    }
  }

  newConversationWithBotMessage(message) {
    this.fuguWidgetService.newConversationWithBotMessage(this.commonService.userDetails.en_user_id, message)
      .subscribe(response => {
        this.commonService.newConversationInitiated.emit({ message: message });
        this.agentLoginViaAuthToken();
      }, error => {
        console.log(error.json());
      });
  }
  onNewCustomer(data) {
    this.fuguWidgetService.getUnreadCount(data, true).subscribe(response => {
      const temp = response.data.agent_customer_unread_count;
      Object.keys(temp).map(uuk => {
        let unreadcount = 0;
        Object.keys(temp[uuk]).map(channelId => {
          unreadcount += temp[uuk][channelId];
          if (this.commonService.channelwiseUnreadCount[channelId].customersInvolved.indexOf(uuk) == -1) {
            this.commonService.channelwiseUnreadCount[channelId].customersInvolved.push(uuk);
          }
        });
        this.commonService.customerwiseUnreadCount[uuk] = unreadcount;
      });
      this.commonService.postMessageToParentWindow({type: 'UnreadCount', data: this.commonService.customerwiseUnreadCount});
    });
  }
  agentLoginViaAuthToken() {
    if (!this.fuguWidgetService.fuguWidgetData.access_token) {
      return;
    }
    this.fuguWidgetService.fuguWidgetData.customer_info = this.fuguWidgetService.fuguWidgetData.customer_info ? this.fuguWidgetService.fuguWidgetData.customer_info : {};
    const updateAppSecretKey: boolean = this.fuguWidgetService.fuguWidgetData.businessKey ? true : false;
    this.router.navigate(['/conversations']);
    this.fuguWidgetService.agentLoginViaAuthToken()
      .takeWhile(() => this.alive)
      .subscribe(response => {

        // var uid = response.data.device_key; to be done later
        // this.commonService.setCookie('f_uid', uid, 10);


        // get configurations
        const t = response.data.access_token;
        const customer_id = response.data.user_id;
        const full_name = response.data.full_name;
        this.commonService.userDetails.access_token = t;
        this.commonService.userDetails.customer_id = customer_id;
        this.commonService.userDetails.en_user_id = response.data.en_user_id;
        this.commonService.userDetails.searched_full_name = full_name;

        this.fuguWidgetService.getConfigurations(t)
        .takeWhile(() => this.alive)
        .subscribe((configResponse) => {
            console.log(configResponse);
            this.fuguWidgetService.configFetchEvent.emit(configResponse);
          },
          error => {
            console.log("get config error: ", error.json())
          });
        const conversation = response.data.conversations || null;
        this.fuguWidgetService.authenticateViaAccessToken(t)
          .takeWhile(() => this.alive)
          .subscribe((res) => {
            //update appSecretKey
            if (updateAppSecretKey)
              this.fuguWidgetService.fuguWidgetData.appSecretKey = res.data.app_secret_key;
            this.commonService.updateUserDetails(res.data);
            this.fayeService.setupSubscriptions();
            if (conversation && conversation.statusCode == 200 && conversation.data && conversation.data.conversation_list.length) {
              // const channelId = conversation.data.conversation_list[0].channel_id;
              // this.router.navigate(['/chat/' + channelId], { queryParams: { customer_id: customer_id }});
              this.commonService.customerConversations = conversation.data.conversation_list;
              this.commonService.customeConversationsChanged.emit();
            } else {
              this.router.navigate(['/chat/-1'], { queryParams: { customer_id: customer_id }});
            }
              // this.router.navigate(["chat/-1"], { queryParams: { label_id: -1, hide_back_btn: true }, skipLocationChange: true });

          },
          error => {
            console.log("agent login error: ", error.json())
          });
      });
  }

  checkArrowPosition(data) {
    console.log('pos' + JSON.stringify(data.data));
    const el = document.getElementById('arrow');
    el.style.borderLeft = null;
    el.style.borderRight = null;
    el.style.borderTop = null;
    el.style.borderBottom = null;
    const iframe_height = data.data.clientHeight - 110 < 553 ? data.data.clientHeight - 110 : 553;
    if ((data.data.y_coordinate + iframe_height) > data.data.clientHeight) {
      console.log('pos' + 'left');
      el.style.borderTop = '10px solid transparent';
      el.style.borderBottom = '10px solid transparent';
      el.style.borderLeft = '10px solid green';
      el.style.top = 10 + 'px';
      el.style.right = 0 + 'px';
    } else if ((data.data.clientHeight - data.data.y_coordinate) > iframe_height) {
      console.log("sasa");
    } else {
      if ((data.data.clientHeight - data.data.y_coordinate) > data.data.y_coordinate) {
        console.log('pos' + 'bottom');
        el.style.borderLeft = '10px solid transparent';
        el.style.borderRight = '10px solid transparent';
        el.style.borderTop = '10px solid green';
        el.style.top = iframe_height + 10 + 'px';
        el.style.right = 370 / 2 + 'px';
      } else {
        console.log('pos' + 'top');
        el.style.borderLeft = '10px solid transparent';
        el.style.borderRight = '10px solid transparent';
        el.style.borderBottom = '10px solid green';
      }
    }
  }
  initAgentWidget() {
    if (!this.fuguWidgetService.fuguWidgetData.access_token) {
      return;
    }
    this.fuguWidgetService.agentLoginViaAuthToken()
          .takeWhile(() => this.alive)
          .subscribe(res => {
            this.commonService.postMessageToParentWindow({ type: 'AccessTokenEvent', data: res.data.access_token });
            this.setupFayeAndGetUnreadCount(res);
            if (this.fuguWidgetService.fuguWidgetData.dashboard_url) {
              this.getWhitelabelDetails();
            }
          });
  }
  initForkedAgentWidget() {
    if (!this.fuguWidgetService.fuguWidgetData.agent_secret_key) {
      return;
    }
    this.fuguWidgetService.agentLoginViaSecretKey()
      .takeWhile(() => this.alive)
      .subscribe(res => {
        this.setupFayeAndGetUnreadCount(res);
        this.commonService.postMessageToParentWindow({ type: 'AccessTokenEvent', data: res.data.access_token });
        if (this.fuguWidgetService.fuguWidgetData.dashboard_url) {
          this.getWhitelabelDetails();
        }
      });
  }
  setupFayeAndGetUnreadCount(res) {
    const access_token = res.data.access_token;
    this.fuguWidgetService.fuguWidgetData.access_token = access_token;
    this.fuguWidgetService.fuguWidgetData.appSecretKey = res.data.app_secret_key;
    this.commonService.userDetails.access_token = access_token;
    this.commonService.userDetails.en_user_id = res.data.en_user_id;
    this.fuguWidgetService.getConfigurations(access_token)
      .takeWhile(() => this.alive)
      .subscribe(configResponse => {
          this.fuguWidgetService.configFetchEvent.emit(configResponse);
        },
        error => {
          console.log('get config error: ', error.json());
        });
    this.commonService.updateUserDetails(res.data);
    this.fayeService.setupSubscriptions();
    this.fuguWidgetService.getUnreadCount(this.fuguWidgetService.fuguWidgetData.user_unique_keys).subscribe(response => {
      const customerwiseUnreadCount = response.data.agent_customer_unread_count;
      const channelwiseUnreadCount = response.data.total_unread_count;
      if (Object.keys(channelwiseUnreadCount).length) {
        Object.keys(channelwiseUnreadCount).map(channelId => {
          this.commonService.channelwiseUnreadCount[channelId] = {};
          this.commonService.channelwiseUnreadCount[channelId].customersInvolved = [];
          this.commonService.channelwiseUnreadCount[channelId].unreadCount = channelwiseUnreadCount[channelId];
          this.commonService.totalUnreadCount += channelwiseUnreadCount[channelId];
        });
      }
      if (Object.keys(customerwiseUnreadCount).length) {
        Object.keys(customerwiseUnreadCount).map(uuk => {
          let unreadcount = 0;
          Object.keys(customerwiseUnreadCount[uuk]).map(channelId => {
            unreadcount += customerwiseUnreadCount[uuk][channelId];
            if (this.commonService.channelwiseUnreadCount[channelId].customersInvolved.indexOf(uuk) == -1) {
              this.commonService.channelwiseUnreadCount[channelId].customersInvolved.push(uuk);
            }
          });
          this.commonService.customerwiseUnreadCount[uuk] = unreadcount;
        });
      }
      this.commonService.postMessageToParentWindow({type: 'UnreadCount', data: this.commonService.customerwiseUnreadCount});
      this.commonService.postMessageToParentWindow({type: 'TotalUnreadCount', data: this.commonService.totalUnreadCount});
    });
  }
  openCustomerConversation() {
    if (!this.fuguWidgetService.fuguWidgetData.access_token) {
      return;
    }
    this.commonService.customerChatClicked.emit();
  }
  ngOnDestroy() {
    this.alive = false;
  }
  getWhitelabelDetails() {
    const url = this.fuguWidgetService.fuguWidgetData.dashboard_url;
    this.fuguWidgetService.getWhitelabelInfo(url).subscribe(res => {
      this.commonService.redirectionTooltipText = res.data.whitelabeled_tab_title;
    }, error => {
    });
  }
}
