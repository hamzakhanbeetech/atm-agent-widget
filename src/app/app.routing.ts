
import { Routes, RouterModule, PreloadingStrategy, Route } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';


const appRoutes: Routes = [
    // { path: '', redirectTo: 'conversations', pathMatch: 'full' },
    // { path: 'notifications', component: NotificationsComponent },
    // { path: 'conversations', component: ConversationsComponent },
    {
      path: 'payment',
      loadChildren: './modules/payment-request/payment-request.module#PaymentRequestModule',
    },
    {
      path: '',
      loadChildren: './modules/layout/layout.module#LayoutModule',
    },
    // { path: 'chat/:channelId', component: ChatComponent },
];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
