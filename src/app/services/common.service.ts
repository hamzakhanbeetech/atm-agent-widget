import { Injectable, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FuguWidgetService } from './fuguWidget.service';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/Rx';
import { FormBuilder, Validators, FormGroup, FormControl, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';

interface UserDetails {
    user_id: number,
    user_unique_key: string,
    user_channel: string,
    full_name: string,
    business_name: string,
    en_user_id: string,
    access_token: string,
    customer_id: any,
    searched_full_name: string;
    max_file_size: any;
}
interface ConfigData {
    "button-new_conversation_visible": boolean,
    "color-background": string,
    "color-text": string,
    "color-theme": string,
    "color-title_bar": string,
    "push_based_on_chat": any,
    "keys-external_api_custom_detail": string,
    "text-subtitle": string,
    "text-title": string,
    "business_image": string,
    "background-color-theme": string,
    "typing-allignment": string,
    "show_widget_default_channel": boolean
}
@Injectable()
export class CommonService implements OnInit, OnDestroy {
    parentOrigin;
    currentUrl;
    ip;
    alive: boolean = true;
    userDetails: UserDetails = <UserDetails>(new Object());
    configData: ConfigData = <ConfigData>(new Object());
    hostname: string = "";
    defaultMessageToPublish: string = "";
    isConversationListValid: boolean;
    iPadState: boolean = true;
    newConversationInitiated: EventEmitter<any> = new EventEmitter<any>();
    customerChatClicked: EventEmitter<any> = new EventEmitter<any>();
    openAgentConversations: EventEmitter<any> = new EventEmitter<any>();
    customerConversations: Array<any> = [];
    showBackButton: boolean = true;
    isCustomerChat = false;
    totalUnreadCount = 0;
    customerwiseUnreadCount = {};
    channelwiseUnreadCount = {}; // channel_id : unread_count and involved customers
    public customeConversationsChanged: EventEmitter<any> = new EventEmitter<any>();
    newPostMessageReceived: EventEmitter<any> = new EventEmitter<any>();
    redirectionTooltipText = 'Hippo Chat';
    constructor(private fuguWidgetService: FuguWidgetService) {
    }

    ngOnInit() {
    }
    public postMessageToParentWindow(obj) {
      obj.message_sender = 'NonCircularAgentIframe';
      (<any>window).parent.postMessage(obj, this.parentOrigin);
    }

    public putUserData() {
        var deviceDetailsObject = this.getUserBrowserDetails();
        var attributesObj: any = {};
        var referralUrl = "";
        var marketingCampaign = "";
        var device_key = "";
        var device_id = "";
        if (!this.f_uid_Id) {
            var uid = this.makeid();
            uid += this.fuguWidgetService.fuguWidgetData.appSecretKey || '';
            this.f_uid_Id = uid;
            device_id = uid;
        }
        else {
            device_id = this.f_uid_Id;
        }
        device_key = this.getCookie('f_uid');
        if (this.fuguWidgetService.fuguWidgetData.address) {
            if (Object.keys(this.fuguWidgetService.fuguWidgetData.address).length) {
                attributesObj.address = {};
                attributesObj.address.name = "";
                if (this.fuguWidgetService.fuguWidgetData.address.city) {
                    attributesObj.address.name += this.fuguWidgetService.fuguWidgetData.address.city;
                }
                if (this.fuguWidgetService.fuguWidgetData.address.country) {
                    attributesObj.address.name += " " + this.fuguWidgetService.fuguWidgetData.address.country;
                }
            }
        }
        if (this.ip) {
            attributesObj.ip = this.ip;
        }

        if (this.currentUrl.indexOf('utm_source') !== -1) {
            var str = this.currentUrl;
            var firstindex = str.indexOf('utm_source');
            var searchIndex = firstindex + str.substring(firstindex).indexOf('&');
            referralUrl = str.substring(firstindex + 11, searchIndex)
        }
        if (this.currentUrl.indexOf('utm_medium') !== -1) {
            var str = this.currentUrl;
            var firstindex = str.indexOf('utm_medium');
            var searchIndex = firstindex + str.substring(firstindex).indexOf('&');
            marketingCampaign = str.substring(firstindex + 11, searchIndex)
        }
        var body: any = {
            'device_id': device_id,
            'device_type': 3,
            'device_details': deviceDetailsObject,
            //'attributes': JSON.stringify(attributesObj) || {},
            'source': 4,
            'browser_language': navigator.language,
            'current_url': this.currentUrl,
        }
        if (this.fuguWidgetService.fuguWidgetData.appSecretKey)
            body['app_secret_key'] = this.fuguWidgetService.fuguWidgetData.appSecretKey;
        else if (this.fuguWidgetService.fuguWidgetData.businessKey)
            body['business_unique_key'] = this.fuguWidgetService.fuguWidgetData.businessKey;
        else{
            throw new Error('no app_secret_key or business_unique_key provided');
        }

        //update attribute obj


        if (referralUrl) {
            body.referral_url = referralUrl;

        }
        if (marketingCampaign) {
            body.marketing_campaign = marketingCampaign;
        }
        if (this.fuguWidgetService.fuguWidgetData.uniqueId) {
            body.user_unique_key = encodeURIComponent(this.fuguWidgetService.fuguWidgetData.uniqueId);
        }
        if (this.fuguWidgetService.fuguWidgetData.email) {
            body.email = this.fuguWidgetService.fuguWidgetData.email;
        }
        if (this.fuguWidgetService.fuguWidgetData.name) {
            body.full_name = this.fuguWidgetService.fuguWidgetData.name;
        }
        if (this.fuguWidgetService.fuguWidgetData.phone) {
            body.phone_number = this.fuguWidgetService.fuguWidgetData.phone;
        }
        if (this.fuguWidgetService.fuguWidgetData.customAttributes) {
            body.custom_attributes = JSON.stringify(this.fuguWidgetService.fuguWidgetData.customAttributes) || JSON.stringify({});
        }
        else {
            body.custom_attributes = JSON.stringify({})
        }

        if (!device_key) {
            // var uid = makeid();
            // uid += appUserInfo.appSecretKey || '';
            // localStorage.setItem('f_uid',uid);
            // device_id = uid;
        }
        else {
            body.device_key = device_key;
        }

        //urls
        let utm_src = this.getParameterByName(this.currentUrl, "utm_source");
        let utm_medium = this.getParameterByName(this.currentUrl, "utm_medium");
        if (utm_src) {
            attributesObj["referral_url"] = utm_src;
        }
        if (utm_medium) {
            attributesObj["marketing_campaign"] = utm_medium;
        }
        body["attributes"] = JSON.stringify(attributesObj) || {};
        body["app_version_code"] = 200;
        return body;
    }
    putUserDataForCustomer() {
      const body: any = {};
      if (this.fuguWidgetService.fuguWidgetData.customer_info.reseller_token) {
        body['reseller_token'] = this.fuguWidgetService.fuguWidgetData.customer_info.reseller_token;
      }
      if (this.fuguWidgetService.fuguWidgetData.customer_info.reference_id) {
        body['reference_id'] = this.fuguWidgetService.fuguWidgetData.customer_info.reference_id;
      }
      if (this.fuguWidgetService.fuguWidgetData.customer_info.user_unique_key) {
        body['user_unique_key'] = this.fuguWidgetService.fuguWidgetData.customer_info.user_unique_key;
      }
      if (this.fuguWidgetService.fuguWidgetData.appSecretKey) {
        body['app_secret_key'] = this.fuguWidgetService.fuguWidgetData.appSecretKey;
      }
      body['device_type'] = 3;
      body['device_id'] = 0;
      return body;
    }
    public getUserBrowserDetails(): string {
        var unknown = '-', width, height;

        // screen
        var screenSize = '';
        if (screen.width) {
            width = (screen.width) ? screen.width : '';
            height = (screen.height) ? screen.height : '';
            screenSize += '' + width + " x " + height;
        }

        // browser
        var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;
        var browser = navigator.appName;
        var version = '' + parseFloat(navigator.appVersion);
        var majorVersion = parseInt(navigator.appVersion, 10);
        var nameOffset, verOffset, ix;

        // Opera
        if ((verOffset = nAgt.indexOf('Opera')) != -1) {
            browser = 'Opera';
            version = nAgt.substring(verOffset + 6);
            if ((verOffset = nAgt.indexOf('Version')) != -1) {
                version = nAgt.substring(verOffset + 8);
            }
        }
        // Opera Next
        if ((verOffset = nAgt.indexOf('OPR')) != -1) {
            browser = 'Opera';
            version = nAgt.substring(verOffset + 4);
        }
        // Edge
        else if ((verOffset = nAgt.indexOf('Edge')) != -1) {
            browser = 'Microsoft Edge';
            version = nAgt.substring(verOffset + 5);
        }
        // MSIE
        else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
            browser = 'Microsoft Internet Explorer';
            version = nAgt.substring(verOffset + 5);
        }
        // Chrome
        else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
            browser = 'Chrome';
            version = nAgt.substring(verOffset + 7);
        }
        // Safari
        else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
            browser = 'Safari';
            version = nAgt.substring(verOffset + 7);
            if ((verOffset = nAgt.indexOf('Version')) != -1) {
                version = nAgt.substring(verOffset + 8);
            }
        }
        // Firefox
        else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
            browser = 'Firefox';
            version = nAgt.substring(verOffset + 8);
        }
        // MSIE 11+
        else if (nAgt.indexOf('Trident/') != -1) {
            browser = 'Microsoft Internet Explorer';
            version = nAgt.substring(nAgt.indexOf('rv:') + 3);
        }
        // Other browsers
        else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
            browser = nAgt.substring(nameOffset, verOffset);
            version = nAgt.substring(verOffset + 1);
            if (browser.toLowerCase() == browser.toUpperCase()) {
                browser = navigator.appName;
            }
        }
        // trim the version string
        if ((ix = version.indexOf(';')) != -1) version = version.substring(0, ix);
        if ((ix = version.indexOf(' ')) != -1) version = version.substring(0, ix);
        if ((ix = version.indexOf(')')) != -1) version = version.substring(0, ix);

        majorVersion = parseInt('' + version, 10);
        if (isNaN(majorVersion)) {
            version = '' + parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion, 10);
        }

        // mobile version
        var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

        // cookie
        var cookieEnabled = (navigator.cookieEnabled) ? true : false;

        if (typeof navigator.cookieEnabled == 'undefined' && !cookieEnabled) {
            document.cookie = 'testcookie';
            cookieEnabled = (document.cookie.indexOf('testcookie') != -1) ? true : false;
        }

        // system
        var os = unknown;
        var clientStrings = [
            { s: 'Windows 10', r: /(Windows 10.0|Windows NT 10.0)/ },
            { s: 'Windows 8.1', r: /(Windows 8.1|Windows NT 6.3)/ },
            { s: 'Windows 8', r: /(Windows 8|Windows NT 6.2)/ },
            { s: 'Windows 7', r: /(Windows 7|Windows NT 6.1)/ },
            { s: 'Windows Vista', r: /Windows NT 6.0/ },
            { s: 'Windows Server 2003', r: /Windows NT 5.2/ },
            { s: 'Windows XP', r: /(Windows NT 5.1|Windows XP)/ },
            { s: 'Windows 2000', r: /(Windows NT 5.0|Windows 2000)/ },
            { s: 'Windows ME', r: /(Win 9x 4.90|Windows ME)/ },
            { s: 'Windows 98', r: /(Windows 98|Win98)/ },
            { s: 'Windows 95', r: /(Windows 95|Win95|Windows_95)/ },
            { s: 'Windows NT 4.0', r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/ },
            { s: 'Windows CE', r: /Windows CE/ },
            { s: 'Windows 3.11', r: /Win16/ },
            { s: 'Android', r: /Android/ },
            { s: 'Open BSD', r: /OpenBSD/ },
            { s: 'Sun OS', r: /SunOS/ },
            { s: 'Linux', r: /(Linux|X11)/ },
            { s: 'iOS', r: /(iPhone|iPad|iPod)/ },
            { s: 'Mac OS X', r: /Mac OS X/ },
            { s: 'Mac OS', r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/ },
            { s: 'QNX', r: /QNX/ },
            { s: 'UNIX', r: /UNIX/ },
            { s: 'BeOS', r: /BeOS/ },
            { s: 'OS/2', r: /OS\/2/ },
            { s: 'Search Bot', r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/ }
        ];
        for (var id in clientStrings) {
            var cs = clientStrings[id];
            if (cs.r.test(nAgt)) {
                os = cs.s;
                break;
            }
        }

        var osVersion: any = unknown;

        if (/Windows/.test(os)) {
            osVersion = /Windows (.*)/.exec(os)[1];
            os = 'Windows';
        }

        switch (os) {
            case 'Mac OS X':
                osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
                break;

            case 'Android':
                osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
                break;

            case 'iOS':
                osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
                break;
        }

        var browserLanguage = navigator.language;
        var url = window.location.href;
        url = url.replace("https://", "");
        url = url.replace("http://", "");

        let jscd = {
            screen: screenSize,
            browser: browser,
            browserVersion: version,
            browserMajorVersion: majorVersion,
            mobile: mobile,
            os: os,
            osVersion: osVersion,
            cookies: cookieEnabled,
            browserLanguage: browserLanguage,
            browserUrl: url
        }

        var deviceDetails = {
            "Browser Version": jscd.browserVersion,
            "Browser": jscd.browser + ' ' + jscd.browserMajorVersion,
            "Browser Language": jscd.browserLanguage,
            "OS": jscd.os + ' ' + jscd.osVersion,
            "Cookies Enabled": jscd.cookies,
            "Screen Size": jscd.screen,
            "Source": jscd.browserUrl
        }
        return JSON.stringify(deviceDetails);
    }

    private makeid() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 10; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        var d = new Date();
        var n = d.getTime();
        text += n;
        return text;
    }

    public getCookie(cname) {
        let _storage: any = localStorage.getItem('fuguWidget');
        if (_storage) {
            _storage = JSON.parse(_storage);
        }
        // let domain = localStorage.getItem("domain");
        var website_host = this.website_host;

        if (_storage && website_host && Object.keys(_storage).indexOf(website_host) > -1) {
            // var name = cname + "=";
            // var decodedCookie = decodeURIComponent(document.cookie);
            // var ca = decodedCookie.split(';');
            // for (var i = 0; i < ca.length; i++) {
            //     var c = ca[i];
            //     while (c.charAt(0) == ' ') {
            //         c = c.substring(1);
            //     }
            //     if (c.indexOf(name) == 0) {
            //         return c.substring(name.length, c.length);
            //     }
            // }
            let v = _storage[website_host][cname];
            if (v)
                return v;
            return "";
        }
        else return ""
    }

    public setCookie(cname, cvalue, exdays) {
        var d = new Date();
        var website_host = this.website_host;
        // d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        // var expires = "expires=" + d.toUTCString();
        // document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;domain=." + website_host;
        //set in localstorage as well
        let _storage: any = localStorage.getItem('fuguWidget')
        if (_storage) {
            //check for key in this domain
            _storage = JSON.parse(_storage);
            if (!_storage[website_host])
                _storage[website_host] = {};
            _storage[website_host][cname] = cvalue;
        }
        else {
            _storage = {};
            _storage[website_host] = {};
            _storage[website_host][cname] = cvalue;
        }
        localStorage.setItem("fuguWidget", JSON.stringify(_storage));
    }

    public updateUserDetails(data) {
        this.userDetails.business_name = data.business_name;
        this.userDetails.full_name = data.full_name;
        this.userDetails.user_channel = data.user_channel;
        this.userDetails.user_id = data.user_id;
        this.userDetails.user_unique_key = data.user_unique_key || '';
        this.userDetails.en_user_id = data.en_user_id || '';
        this.userDetails.access_token = data.access_token;
        this.userDetails.max_file_size = data.max_file_size;
    }
    public updateConfigDetails(data) {
        this.configData["button-new_conversation_visible"] = data["button-new_conversation_visible"];
        this.configData["color-background"] = data["color-background"];
        this.configData["color-text"] = data["color-text"];
        this.configData["color-theme"] = data["color-theme"];
        this.configData["color-title_bar"] = data["color-title_bar"];
        this.configData["push_based_on_chat"] = data["push_based_on_chat"];
        this.configData["keys-external_api_custom_detail"] = data["keys-external_api_custom_detail"];
        this.configData["text-subtitle"] = data["text-subtitle"];
        this.configData["text-title"] = data["text-title"];
        this.configData["business_image"] = data["business_image"];
        this.configData["background-color-theme"] = data["background-color-theme"];
        this.configData["typing-allignment"] = data["typing-allignment"];
        this.configData["show_widget_default_channel"] = !!+data["show_widget_default_channel"];
    }

    public userLogout(hostname) {
        var cookie = this.getCookie('f_uid');
        // var ls = localStorage.getItem('f_uid');
        var website_host = this.website_host;
        if (cookie) {
            // document.cookie = 'f_uid' + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;domain=.' + website_host;
            var body = `app_secret_key=${encodeURIComponent(this.fuguWidgetService.fuguWidgetData.appSecretKey)}&en_user_id=${this.userDetails.en_user_id}`;
            this.fuguWidgetService.logOutUser(body)
                .takeWhile(() => this.alive)
                .subscribe(response => {
                    console.log("logout success");
                    this.postMessageToParentWindow({ type: "Shutdown", data: {} });
                },
                    error => {
                        console.log("logout error")
                        this.postMessageToParentWindow({ type: "Shutdown", data: {} });
                    })
        }
        else {
            //$('#fugu-container').remove();
            this.postMessageToParentWindow({ type: "Shutdown", data: {} });
        }
        localStorage.removeItem('f_uid_Id')
        localStorage.removeItem("f_uid")
        let _storage = localStorage.getItem("fuguWidget");
        if (_storage) {
            _storage = JSON.parse(_storage);
            delete _storage[website_host];
            localStorage.setItem("fuguWidget", JSON.stringify(_storage));
        }
    }

    private getParameterByName(url, name) {
        //if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    public get f_uid_Id(): string {
        let _storage: any = localStorage.getItem('fuguWidget');
        let website_host = this.website_host;
        if (!_storage) {
            return "";
        }
        else {
            _storage = JSON.parse(_storage);
            if (_storage[website_host])
                return _storage[website_host]["f_uid_Id"] || "";
            return "";
        }
    }

    public set f_uid_Id(val: string) {
        let _storage: any = localStorage.getItem('fuguWidget');
        let website_host = this.website_host;
        if (_storage) {
            //check for key in this domain
            _storage = JSON.parse(_storage);
            if (!_storage[website_host])
                _storage[website_host] = {};
            _storage[website_host]["f_uid_Id"] = val;
        }
        else {
            _storage = {};
            _storage[website_host] = {};
            _storage[website_host]["f_uid_Id"] = val;
        }
        localStorage.setItem("fuguWidget", JSON.stringify(_storage));
    }

    public get website_host() {
        var website_host = this.hostname;
        var occurences = this.hostname.split(".").length - 1;
        var n = website_host.indexOf(".");
        if (occurences > 1) {
            website_host = website_host.replace(website_host.substring(0, n + 1), '');
        }
        return website_host;
    }
    public fireAllErrors(formGroup: FormGroup) {
        let keys = Object.keys(formGroup.controls);
        keys.forEach((field: any) => {
            const control = formGroup.get(field);
            if (control instanceof FormControl) {
                control.markAsTouched({ onlySelf: true });
                control.markAsDirty({ onlySelf: true });
            } else if (control instanceof FormGroup) {
                this.fireAllErrors(control);
            }
            else if (control instanceof FormArray) {
                (<FormArray>control).controls.forEach((element: FormGroup) => {
                    this.fireAllErrors(element);
                });
            }
        });
    }
    playNotificationSound(filename) {
      document.getElementById("sound").innerHTML = '<audio autoplay="autoplay"><source src="' + filename + '.mp3" type="audio/mpeg" /><source src="' + filename + '.ogg" type="audio/ogg" /><embed hidden="true" autostart="true" loop="false" src="' + filename + '.mp3" /></audio>';
    }
    updateAndEmitUnreadCountOnFaye(channelId, user_unique_key) {
      if (user_unique_key != '0') {
        // another driver's message
        if (!this.channelwiseUnreadCount[channelId]) {
          // if not present in channel dict
          this.channelwiseUnreadCount[channelId] = {
            customersInvolved: [user_unique_key],
            unreadCount: 0
          };
        } else {
          // handle case when unreadCount present in channelwiseUnreadCount but not in custmerwiseUnreadCount
          if (!this.customerwiseUnreadCount[user_unique_key]) {
            this.customerwiseUnreadCount[user_unique_key] = this.channelwiseUnreadCount[channelId].unreadCount;
            if (this.channelwiseUnreadCount[channelId].customersInvolved.indexOf(user_unique_key) == -1) {
              this.channelwiseUnreadCount[channelId].customersInvolved.push(user_unique_key);
            }
          }
        }
        if (!this.customerwiseUnreadCount[user_unique_key]) {
          this.customerwiseUnreadCount[user_unique_key] = 0;
        }
        this.customerwiseUnreadCount[user_unique_key] += 1;
        this.channelwiseUnreadCount[channelId]['unreadCount'] += 1;
      } else {
        // message from other sources like widget
        if (!this.channelwiseUnreadCount[channelId]) {
          this.channelwiseUnreadCount[channelId] = {
            customersInvolved: [],
            unreadCount: 0
          };
        }
        this.channelwiseUnreadCount[channelId]['unreadCount'] += 1;
      }
      this.totalUnreadCount += 1;
      this.postMessageToParentWindow({type: 'UnreadCount', data: this.customerwiseUnreadCount});
      this.postMessageToParentWindow({type: 'TotalUnreadCount', data: this.totalUnreadCount});
    }
    // ** To update unread count on channel click or read event */
    recalculateUnreadCount(channelId) {
      if (this.channelwiseUnreadCount[channelId]) {
        if (this.channelwiseUnreadCount[channelId].customersInvolved.length) {
          // if we have customer for channel clicked
          this.channelwiseUnreadCount[channelId].customersInvolved.map(uuk => {
            // for all customer involved in the channel reduce unread count
            if (this.customerwiseUnreadCount[uuk]) {
              this.customerwiseUnreadCount[uuk] -= this.channelwiseUnreadCount[channelId].unreadCount;
              if (this.customerwiseUnreadCount[uuk] < 0) {
                // if somehow we get negative unread
                this.customerwiseUnreadCount[uuk] = 0;
              }
            }
          });
        }
      } else {
        // channel data not available
        this.channelwiseUnreadCount[channelId] = {
          customersInvolved: [],
          unreadCount: 0
        };
      }
      this.totalUnreadCount -= this.channelwiseUnreadCount[channelId].unreadCount;
      this.channelwiseUnreadCount[channelId].unreadCount = 0;
      this.postMessageToParentWindow({type: 'UnreadCount', data: this.customerwiseUnreadCount});
      this.postMessageToParentWindow({type: 'TotalUnreadCount', data: this.totalUnreadCount});
    }
    ngOnDestroy() {
        this.alive = false;
    }

}
