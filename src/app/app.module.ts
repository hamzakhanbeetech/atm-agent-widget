import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { routing } from './app.routing';
import { CommonService } from './services/common.service';
import { FayeService } from './services/faye.service';
import { FuguWidgetService } from './services/fuguWidget.service';
import { ValidationService } from './services/validation.service';
import { JwCommonModule } from './modules/jw-common/jw-common.module';
import {
  LocationStrategy,
  HashLocationStrategy
} from '@angular/common';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import {LayoutService} from './services/layout.service';
export class MyHammerConfig extends HammerGestureConfig {
  overrides = <any>{
    'pinch': { enable: false },
    'rotate': { enable: false }
  }
}
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    routing,
    BrowserAnimationsModule,
    JwCommonModule

  ],
  providers: [CommonService , ValidationService , FuguWidgetService, FayeService, LayoutService, {
    provide: HAMMER_GESTURE_CONFIG,
    useClass: MyHammerConfig
  },
    { provide: LocationStrategy, useClass: HashLocationStrategy }],
  bootstrap: [AppComponent]
})
export class AppModule { }
