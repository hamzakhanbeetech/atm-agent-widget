import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { JwCommonModule } from '../jw-common/jw-common.module';
import { LayoutComponent } from 'app/components/layout/layout.component';
import { ConversationsComponent } from 'app/components/conversations/conversations.component';
import { ChatComponent } from 'app/components/chat/chat.component';
import { NotificationsComponent } from 'app/components/notifications/notifications.component';
import { MessageContentComponent } from 'app/components/message-content/message-content.component';
import { SharedModule } from '../shared/shared.module';
import {MediaPlayerComponent} from '../../components/media-player/media-player.component';
import {LayoutService} from '../../services/layout.service';


console.log("conversation module loaded")

export const LayoutModuleRoutes: Routes = [
  /* configure routes here */
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '', redirectTo: 'conversations', pathMatch: 'full'
      },
      {
        path: 'conversations',
        component: ConversationsComponent
      },
      {
        path: 'chat/:channelId',
        component: ChatComponent
      }
    ]
  },
];
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(LayoutModuleRoutes),
    JwCommonModule,
    SharedModule
  ],
  declarations: [
    LayoutComponent,
    ConversationsComponent,
    ChatComponent,
    MessageContentComponent,
    MediaPlayerComponent,
    NotificationsComponent
  ],
  providers: [LayoutService],
  exports: [LayoutComponent]
})
export class LayoutModule { }
