import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
// import { layer, slideup } from '../../../../animations/common.animation'

@Component({
  moduleId: module.id,
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // animations: [layer, slideup]
})
export class PopupComponent implements OnInit {
  @Input() header: string;
  @Input() minHeight: string = "";
  @Input() minWidth: string = "700px";
  @Input() maxWidth: string = "700px";
  @Output() onClose: EventEmitter<boolean> = new EventEmitter<boolean>();
  constructor() { }

  ngOnInit() {
  }

  onCloseClick(e) {
    this.onClose.emit(true);
  }

}
