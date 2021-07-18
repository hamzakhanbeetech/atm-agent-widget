import { Injectable, EventEmitter, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Headers, Http, Response } from '@angular/http';
import 'rxjs/add/operator/map';
import { Config } from '../../../config/config';
import { environment} from '../../environments/environment';
import { Observable } from 'rxjs/Observable';
import { CommonService } from "./common.service";
import { FuguWidgetService } from "./fuguWidget.service";
import { NotificationType, Typing, UserType, MessageType } from '../enums/app.enums';

declare var Faye: any;
declare var moment: any;

@Injectable()
export class FayeService implements OnDestroy {
    public client;
    private activeChannelId: number;
    private isFayeConnected: boolean = false;
    public _destroyCheck: boolean = false;
    private pingInterval: any = 0;
    private alive;
    //events
    // public chatReassignedEvent: EventEmitter<object> = new EventEmitter<object>();
    public chatNonReassignEvent: EventEmitter<object> = new EventEmitter<object>();
    public activeChannelIdMessageEvent: EventEmitter<object> = new EventEmitter<object>();
    public activeChannelIdTypingEvent: EventEmitter<object> = new EventEmitter<object>();
    public activeChannelIdMessageSentEvent: EventEmitter<object> = new EventEmitter<object>();
    public readAllEvent: EventEmitter<object> = new EventEmitter<object>();
    public messageDeliveredEvent: EventEmitter<object> = new EventEmitter<object>();
    public messageReadEvent: EventEmitter<object> = new EventEmitter<object>();
    public fayeConnectionEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

    //subscriptions
    private active_channel_id_subscription;
    private app_secret_key_subscription;
    private user_channel_subscription;

    constructor(private commonService: CommonService, private fuguWidgetService: FuguWidgetService) {
    }

    private userChannelSubCallback(event) {
        let eventType = event.notification_type;

        switch (eventType) {
            case NotificationType.Chat_Reassign:
                this.chatReassigned(event);
                break;
            default:
                this.otherEvent(event);
        }

    }
    private chatReassigned(data) {
        //this.chatReassignedEvent.emit(data);
    }
    private otherEvent(data) {
        this.chatNonReassignEvent.emit(data);
    }
    public subscribeToChannel(channelId: number) {
        this.unsubscribeToActiveChannel()
        this.activeChannelId = channelId;

        //this.client.then(() => {

        //subscribe to the channel
        this.active_channel_id_subscription = this.client.subscribe("/" + this.activeChannelId, (message) => {
            this.activeChannelIdSubCallback(message)
        })
        // this.active_channel_id_subscription.then(() => {
        //     console.log("subscription is now active");
        // });
        //});

    }
    private activeChannelIdSubCallback(message) {
        let notificationType = message.notification_type;
        switch (notificationType) {
            case NotificationType.Read_All:
                //fire message read event.
                if (!environment.production) {
                  console.log("Faye Service => active channel Message Read response:", message);
                }
                this.messageReadEvent.emit(message);
                break;
            default:
                let typing = message.is_typing;
                switch (typing) {
                    case Typing.Typing_Start:
                    case Typing.Typing_Stopped:
                        this.activeChannelIdTypingEvent.emit(message);
                        break;
                    case Typing.Typing_End:
                      if (!environment.production) {
                        console.log("Faye Service => active channel response: ", message);
                      }
                      this.activeChannelIdMessageEvent.emit(message);
                }
        }
    }
    public unsubscribeToActiveChannel() {
        if (this.active_channel_id_subscription) {
            this.active_channel_id_subscription.cancel();
            this.active_channel_id_subscription.unsubscribe();
            this.activeChannelId = 0;
        }
    }
    public sendMessage(data) {

        let emitSuccessEvent = data.is_typing == Typing.Typing_End, index = -1;
        if (emitSuccessEvent)
            index = data.index;
        let s = this.client.publish("/" + this.activeChannelId, data, { deadline: 18, attempts: 1 })
            .then(
            response => {
                // console.log("message sent to server!")
                if (emitSuccessEvent && index != -1) {
                    this.activeChannelIdMessageSentEvent.emit({ index: index })
                }

            },
            error => {
                console.log("message sending failed!")
            })
        // console.log(s);
    }

    public publishOnChannel(channel_id, data): Promise<any> {
      data.device_payload = {
        'device_details': navigator.userAgent,
        'device_id': this.commonService.f_uid_Id,
        'device_type': 3
      };
      return this.client.publish('/' + channel_id, data, { attempts: 1 })
        .then(
          response => {
            // message sent to server acknowledgement!
          },
          error => {
            console.log('message sending failed! ' + JSON.stringify(error.message));
            throw error;
          });
    }

    private setupSchedular() {
        let self = this;
        var BackoffScheduler = function () {
            Faye.Scheduler.apply(this, arguments);
        };
        BackoffScheduler.prototype = Object.create(Faye.Scheduler.prototype);

        BackoffScheduler.prototype.send = function () {
            if (this.message.channel == "/meta/handshake" || this.message.channel == "/meta/connect") {
                try {
                    this.message["ext"] = {
                        user_id: self.commonService.userDetails.user_id,
                        device_type: 3,//browser
                        source: 4 //widget
                    }
                }
                catch (e) {
                    console.log("Faye Before send ", e);
                }
            }
            Faye.Scheduler.prototype.send.apply(this, arguments);
            // if (this.message.channel == "/" + this.activeChannelId)
            // console.log('schedular send => Sent message: ', this);
            //console.log(JSON.stringify(this));
        };
        BackoffScheduler.prototype.fail = function () {
            Faye.Scheduler.prototype.fail.apply(this, arguments);
            if (this.message.channel == "/" + this.activeChannelId)
                console.log('Failed message:', this.message);
        };
        BackoffScheduler.prototype.succeed = function () {
            Faye.Scheduler.prototype.succeed.apply(this, arguments);
            if (this.message.channel == "/" + this.activeChannelId)
                console.log('succeededÎ message:', this.message);
        };
        return BackoffScheduler;
    }
    private appSecretKeySubCallback(channel: string, message: any) {
        let type = message.notification_type;
        switch (type) {
            case NotificationType.Read_All:
                if (message.user_type == UserType.Agent && message.channel_id == this.activeChannelId)
                    this.readAllEvent.emit(message);
                break;
            case NotificationType.Read_Unread:
                if (message.channel_id == this.activeChannelId) {
                    if (message.delivered_at) {
                        //fire message delivered event
                        this.messageDeliveredEvent.emit(message);
                    }
                    else {
                        //fire message read event.
                        this.messageReadEvent.emit(message);
                    }
                }
                break;
            case NotificationType.User_Migration:
                let user_id = this.commonService.userDetails.user_id;
                console.log("Widget Faye Migration: ", message);
                if (user_id == message.migrated_to || user_id == message.user_id) {
                    console.log("valid user migration");
                    //call put user details
                    this.fuguWidgetService.putUserDetails(this.commonService.putUserData())
                        .takeWhile(() => this.alive)
                        .subscribe(response => {
                            var uid = response.data.device_key;
                            this.commonService.setCookie('f_uid', uid, 10);
                            //device_key = uid;
                            this.commonService.updateUserDetails(response.data);
                            this.commonService.postMessageToParentWindow({ type: "Collapse" })
                            this.unsubscribeAllSubscriptions(false);
                            this.setupSubscriptions();

                            //check for conversations -- test basis
                            if (this.commonService.userDetails.user_unique_key.length > 1) {
                                //logged in user
                                this.commonService.isConversationListValid = Object.keys(response.data.conversations).length > 0 ? true : false;
                            }
                            else {
                                let res: Array<any> = response.data.conversations.filter((obj) => {
                                    return obj.channel_id != -1 ? true : false;
                                });
                                this.commonService.isConversationListValid = res.length != 0 ? true : false;
                            }
                        });
                }
                break;
            case NotificationType.User_Logout:
                if (message.user_id == this.commonService.userDetails.user_id) {
                    localStorage.removeItem('f_uid_Id')
                    localStorage.removeItem("f_uid")
                    let _storage = localStorage.getItem("fuguWidget");
                    if (_storage) {
                        _storage = JSON.parse(_storage);
                        delete _storage[this.commonService.website_host];
                        localStorage.setItem("fuguWidget", JSON.stringify(_storage));
                    }
                    // document.cookie = 'f_uid' + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;domain=.' + this.commonService.hostname;

                    // this.commonService.postMessageToParentWindow({ type: "Collapse" });
                    this.unsubscribeAllSubscriptions(true);
                    this.commonService.postMessageToParentWindow({ type: "Shutdown", data: {} });
                }
        }
    }
    public sendAck_Delivered(data) {
        let channelName = `/${this.fuguWidgetService.fuguWidgetData.appSecretKey}/readUnread`
        this.client.publish(channelName, data)
            .then(response => {
                // console.log("Delivered msg sent to server");
            },
            error => {
                console.log("failed to send delivered msg to server");
            });
    }
    public sendAck_Read(data) {
        let channelName = "/" + this.activeChannelId
        this.client.publish(channelName, data)
            .then(response => {
                // console.log("Read msg sent to server", data);
            },
            error => {
                console.log("failed to send read msg to server");
            });
    }
    public setupSubscriptions() {
        this.logError("from AgentWidget => logging in user ", new Date());
        //unssubscribe all
        this.unsubscribeAllSubscriptions(this._destroyCheck);
        if (this._destroyCheck)
            return;
        //subscribe all
        let Scheduler = this.setupSchedular();
        this.client = new Faye.Client(`${environment.FAYE_ENDPOINT}`, { scheduler: Scheduler, timeout: 20, retry: 2, interval: 20 });
        //this.client.disable('websocket');
        this.client.disable('autodisconnect');
        // this.client.then(() => {
        //   this.app_secret_key_subscription = this.client.subscribe(`/${this.fuguWidgetService.fuguWidgetData.appSecretKey}/**`)
        //       .withChannel((channel, message) => {
        //           // handle message
        //           console.log("in faye service app_secret_key_subscription channel: ", channel, " , message: ", message);
        //           this.appSecretKeySubCallback(channel, message);
        //       });
          this.user_channel_subscription = this.client.subscribe(`/${this.commonService.userDetails.user_channel}`, (message) => {
              //this.showControlChannelData(data);
              if (!environment.production) {
                console.log("in FayeService => UserChannelSubs", message);
              }
              this.userChannelSubCallback(message);
          });
        // });

        var self = this;
        this.client.on('transport:down', () => {
            // the client is offline
            let d = new Date()
            let msg = " Faye disconnected =>  " + d.toLocaleTimeString();
            console.log(msg)
            //emit waiting for network event
            this.isFayeConnected = false;
            this.fayeConnectionEvent.emit(false);
            this.ping();
            //send pings after 2s
            this.pingInterval = setInterval(() => {
                if (!this._destroyCheck)
                    this.ping();
                else {
                    clearInterval(this.pingInterval);
                }
            }, 2000)
            //log in db
            this.logError(msg, d);
        });

        this.client.on('transport:up', () => {
            let d = new Date()
            let msg = " Faye connected =>  " + d.toLocaleTimeString();
            console.log(msg)
            //emit connected to network  event
            this.isFayeConnected = true;
            this.fayeConnectionEvent.emit(true);
            clearInterval(this.pingInterval);
            //log in db
            this.logError(msg, d);
        });
        console.log("Faye service => Subscribed all channels");
        // this.FayeLogging();

    }
    public unsubscribeAllSubscriptions(onDestroy, msg?: string) {
        this._destroyCheck = onDestroy;
        if (onDestroy)
            this.logError(msg, new Date());
        if (this.active_channel_id_subscription) {
            this.active_channel_id_subscription.cancel();
            this.active_channel_id_subscription.unsubscribe();
        }
        if (this.user_channel_subscription) {
            this.user_channel_subscription.cancel();
            this.user_channel_subscription.unsubscribe();
        }
        if (this.app_secret_key_subscription) {
            this.app_secret_key_subscription.cancel();
            this.app_secret_key_subscription.unsubscribe();
        }
        if (this.client) {
            this.client.unsubscribe();
            this.client.disconnect();
        }
        this.activeChannelId = 0;
        console.log("Faye service => unsubscribed all channels");
    }
    public ping() {
        if (this._destroyCheck || !this.commonService.userDetails.user_id) return;
        let now = moment().utc().format();
        let data = {
            message: '',
            full_name: this.commonService.userDetails.full_name,
            user_id: this.commonService.userDetails.user_id,
            date_time: now,
            is_typing: Typing.Typing_Stopped,
            message_type: MessageType.Customer_Agent_Message,
            user_type: UserType.Customer,
            on_subscribe: 1
        }
        this.sendMessage(data);
    }
    ngOnDestroy() {
        this.unsubscribeAllSubscriptions(true);
        this.alive = false;
    }
    private logError(msg: string, d: Date) {
        // try {
        //     if (this.commonService.loginData) {
        //         let ex = {
        //             msg: msg,
        //             date: d,
        //             user_id: this.commonService.loginData.user_id,
        //             email: this.commonService.loginData.email,
        //             app_secret_key: this.commonService.loginData.app_secret_key,
        //             business_id: this.commonService.loginData.business_id
        //         }
        //         this.commonService.logException(ex).subscribe(
        //             response => {
        //                 console.log("logged in db")
        //             }, error => {
        //                 const errorData = error.json();
        //                 console.log("Logger = > ", errorData);
        //             });
        //     }
        // }
        // catch (e) {

        // }
        console.log("widget Faye exceptions: ", msg);
    }
}
