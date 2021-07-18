// import { Directive, ElementRef, Renderer, EventEmitter, OnInit, OnDestroy } from '@angular/core';

// interface FuguTouches {
//     "touchstart": { "x": number, "y": number },
//     "touchmove": { "x": number, "y": number },
//     "touchend": boolean,
//     "direction": string
// }

// @Directive({
//     selector: '[autofocus]'
// })
// export class TouchMove implements OnInit, OnDestroy {

//     swipeFn: any;
//     private touchstartFn: Function;
//     private touchmoveFn: Function
//     private touchendFn: Function
//     public direction: EventEmitter<string> = new EventEmitter();

//     constructor(private el: ElementRef, private renderer: Renderer) {
//         this.swipeFn = {
//             "touchstart": { "x": -1, "y": -1 },
//             "touchmove": { "x": -1, "y": -1 },
//             "touchend": false,
//             "direction": ""
//         }
       
//     }

//     ngOnInit() {
//         this.initTouchMove();
//     }

//     initTouchMove() {
//         this.touchstartFn = this.renderer.listen('document', 'touchstart', this.onTouchEvent)
//         this.touchmoveFn = this.renderer.listen('document', 'touchmove', this.onTouchEvent)
//         // this.touchendFn = this.renderer.listen('document', 'touchend', this.onTouchEvent)

//     }

//     onTouchEvent(event: TouchEvent) {
//         var touch;
//         if (typeof event !== 'undefined') {
//             event.preventDefault();
//             if (typeof event.touches !== 'undefined') {
//                 touch = event.touches[0];
//                 switch (event.type) {
//                     case 'touchstart':
//                     case 'touchmove':
//                         this.swipeFn[event.type].x = touch.pageX;
//                         this.swipeFn[event.type].y = touch.pageY;
//                     case 'touchend':
//                         this.swipeFn[event.type] = true;
//                         if (this.swipeFn.touchstart.x > -1 && this.swipeFn.touchmove.x > -1) {
//                             this.swipeFn.direction = this.swipeFn.touchstart.x < this.swipeFn.touchmove.x ? "right" : "left";
//                             this.direction.emit(this.swipeFn.direction);
//                             // DO STUFF HERE
//                             console.log({ e: event, direction: this.swipeFn.direction });
//                         }
//                         else if (this.swipeFn.touchstart.y > -1 && this.swipeFn.touchmove.y > -1) {
//                             this.swipeFn.direction = this.swipeFn.touchstart.y < this.swipeFn.touchmove.y ? "down" : "up";
//                             this.direction.emit(this.swipeFn.direction);
//                             // DO STUFF HERE
//                             console.log({ event: event, direction: this.swipeFn.direction });
//                         }
//                     default:
//                         break;
//                 }
//             }
//         }
//     }

//     closeTouchMove() {
//         this.touchstartFn();
//         this.touchmoveFn();
//     }

//     ngOnDestroy() {
//         this.closeTouchMove();
//     }

// }