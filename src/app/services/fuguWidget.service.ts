import { Injectable, EventEmitter } from '@angular/core';
import { Headers, Http, Response, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';
import { Config } from '../../../config/config';
import { environment } from '../../environments/environment';

interface FuguWidgetData {
    appSecretKey?: string; // businessKey or appSecretKey is required to initFugu
    businessKey?: string;
    collapseType?: string;
    showData?: boolean;
    address?: any;
    uniqueId?: string;
    email?: string;
    name?: string;
    phone?: string;
    customAttributes?: any;
    tags?: Array<any>;
    color?: string;
    businessName?: string;
    access_token?: string;
    customer_info?: any;
    user_unique_keys?;
    is_fork?;
    agent_secret_key?;
    dashboard_url?;
    is_payment_enabled?: boolean;
    customWhitelabelPointing?: boolean;
}

@Injectable()
export class FuguWidgetService {

    private _fuguWidgetData: FuguWidgetData;
    public get fuguWidgetData() {
        return this._fuguWidgetData;
    }
    public set fuguWidgetData(val) {
        this._fuguWidgetData = val;
    }
    public configFetchEvent: EventEmitter<any> = new EventEmitter<any>();

    constructor(private http: Http) {
    }

    putUserDetails(body) {
        // let ca = body.custom_attributes;
        // let a = body.attributes;
        // delete body.custom_attributes;
        // delete body.attributes;
        body = Object.keys(body).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(body[key]);
        }).join('&');
        const headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        return this.http
            .post(`${environment.API_ENDPOINT}users/putUserDetails`, body.trim(), { headers: headers })
            .map(response => response.json());
    }

    putUserDetailsReseller(body, neglectConversation?) {
      if (neglectConversation) {
        body['neglect_conversations'] = neglectConversation;
      }
      body = Object.keys(body).map(function (key) {
          return encodeURIComponent(key) + '=' + encodeURIComponent(body[key]);
      }).join('&');
      const headers = new Headers();
      headers.append('Content-Type', 'application/x-www-form-urlencoded');
      return this.http
          .post(`${environment.API_ENDPOINT}reseller/putUserDetails`, body.trim(), { headers: headers })
          .map(response => response.json());
    }

    getGroupingTags(team_ids) {
      if (team_ids.length) {
        return team_ids.map((team_id) => {
          return {
            reseller_team_id: team_id.toString()
          };
        });
      }
      return [];
    }
    agentLoginViaAuthToken() {
      const body: any = {
        auth_token: this.fuguWidgetData.access_token,
      };
      return this.http
        .post(`${environment.API_ENDPOINT}agent/v1/agentLoginViaAuthToken`, body)
        .map((response: any) => JSON.parse(response._body));

    }
    agentLoginViaSecretKey() {
      const body: any = {
        agent_secret_key: this.fuguWidgetData.agent_secret_key,
      };
      return this.http
        .post(`${environment.API_ENDPOINT}agent/getAgentLoginInfo`, body)
        .map((response: any) => JSON.parse(response._body));
    }
    getConfigurations(access_token) {
      const body = {
        access_token: access_token,
      };

      return this.http
        .post(`${environment.API_ENDPOINT}business/getConfiguration`, body)
        .map((response: any) => JSON.parse(response._body));
    }

    authenticateViaAccessToken(accessToken: any) {
      // var body = `access_token=${encodeURIComponent(accessToken)}`;

      const body = {
        access_token: accessToken,
        device_id: localStorage.getItem('device_uuid')
      }
      return this.http
        .post(`${environment.API_ENDPOINT}agent/agentLogin`, body)
        .map((response: any) => JSON.parse(response._body));
    }
    getUnreadCount(user_unique_keys, neglectTotalUnread?) {
      if (!this.fuguWidgetData.user_unique_keys) {
        return;
      }
      const body = {
        access_token: this.fuguWidgetData.access_token,
      };
      if (user_unique_keys.length) {
        body['user_unique_keys'] = user_unique_keys;
      }
      if (neglectTotalUnread) {
        body['neglect_total_unread_count'] = true;
      }
      return this.http
        .post(`${environment.API_ENDPOINT}conversation/getUnreadCount`, body)
        .map((response: any) => JSON.parse(response._body));
    }

    findIP() {
        const headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        return this.http
            .get(`https://jsonip.com`, { headers: headers })
            .map(response => response.json());
    }

    getConversations(access_token , user_id , search_user_id, page_start) {
      const body = {
        access_token: access_token,
        en_user_id: user_id,
        type: [0 , 3],
        status: [1],
        label: [],
        channel_filter: [],
        page_start: page_start,
        append_channel_id: -1,
      };
      if (search_user_id) {
        body['search_user_id'] = search_user_id;
      }
      return this.http
        .post(`${environment.API_ENDPOINT}conversation/v1/getConversations`, body)
        .map((response: any) => JSON.parse(response._body));
    }

    getMessages(obj) {
      const body = {
        access_token: obj.access_token,
        channel_id: obj.channelId,
        en_user_id: obj.user_id,
        page_start: obj.page_start
      };
      return this.http
        .post(`${environment.API_ENDPOINT}conversation/getMessages`, body)
        .map((response: any) => JSON.parse(response._body));
    }

    adminToUserChat(obj) {
      return this.http
        .post(`${environment.API_ENDPOINT}conversation/createConversation`, obj)
        .map((response: any) => JSON.parse(response._body));
    }

    createOneToOneChat(access_token, data) {
      const body = {
        access_token: access_token,
      };
      if (data.email) {
        body['chat_with_email'] = data.email;
      } else if (data.user_id) {
        body['chat_with_user_id'] = data.user_id;
      }
      return this.http
        .post(`${environment.API_ENDPOINT}chat/createOneToOneChat`, body)
        .map((response: any) => JSON.parse(response._body));
    }

    createConversation(label_id: number, user_id, convObj?: any) {
        var headers = new Headers();
        let body = `app_secret_key=${encodeURIComponent(this.fuguWidgetData.appSecretKey)}&label_id=${label_id}&en_user_id=${user_id}&source=4`;
        if (convObj && Object.keys(convObj)) {
            if (convObj.tags && convObj.tags.length) {
                let tags = convObj.tags.map((e) => {
                    return e.toString();
                });
                body += `&tags=${JSON.stringify(tags)}`;
            }
            if (convObj.custom_label) {
                body += `&custom_label=${convObj.custom_label}`;
            }
            if (convObj.transaction_id) {
                body += `&transaction_id=${convObj.transaction_id}`;
            }
            if (convObj.user_unique_key) {
                body += `&user_unique_key=${convObj.user_unique_key}`;
            }
            if (convObj.other_user_unique_key) {
                const uniqueKeys = convObj.tags.map((e) => {
                  return e.toString();
                });
                body += `&other_user_unique_key=${JSON.stringify(uniqueKeys)}`;
            }
            if (convObj.chat_type) {
                body += `&chat_type=${convObj.chat_type}`;
            }
            // if (convObj.en_user_id) {
            //     body += `&en_user_id=${convObj.en_user_id}`;
            // }
        }
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        return this.http
            .post(`${environment.API_ENDPOINT}conversation/createConversation`, body, { headers: headers })
            .map(response => response.json());
    }

    sendImage(formdata: FormData) {
        const headers = new Headers();
        // formdata.append('app_secret_key', this.fuguWidgetData.appSecretKey);
        headers.append('Accept', 'application/json');
        return this.http
            .post(`${environment.API_ENDPOINT}conversation/uploadFile`, formdata, { headers: headers })
            .map(response => response.json());
    }

    logOutUser(body) {
        const headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        return this.http
            .post(`${environment.API_ENDPOINT}users/userlogout`, body, { headers: headers })
            .map(response => response.json());
    }

    newConversationWithBotMessage(user_id, msg: string) {
        const headers = new Headers();
        const tags = this.fuguWidgetData.tags;
        let body = `app_secret_key=${encodeURIComponent(this.fuguWidgetData.appSecretKey)}&chat_type=0&en_user_id=${user_id}&bot_default_message=${msg}`;
        if (tags) {
            body += `&tags=${JSON.stringify(tags)}`;
        }
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        return this.http
            .post(`${environment.API_ENDPOINT}conversation/createConversation`, body, { headers: headers })
            .map(response => response.json());
    }

    receiveBotAction(data) {
        const headers = new Headers();
        return this.http
            .post(`${environment.API_ENDPOINT}bot/receiveBotAction`, data, { headers: headers })
            .map(response => response.json());
    }
    getWhitelabelInfo(data) {
      return this.http
        .get(`${environment.API_ENDPOINT}business/whitelabelProperties?url=${data}`)
        .map((response: any) => response.json());
    }

}
