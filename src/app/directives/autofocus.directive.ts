import { Directive, ElementRef, Renderer, Input } from '@angular/core';

@Directive({
    selector: '[autofocus]'
})
export class Autofocus {
    _autofocus: boolean = true;
    @Input("show")
    set autofocus(val) {
        this._autofocus = val;
        if (this._autofocus)
            this.focus();
    }
    constructor(private el: ElementRef, private renderer: Renderer) {
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        if (this._autofocus)
            this.focus();
    }
    focus() {
        this.renderer.invokeElementMethod(this.el.nativeElement, 'focus', []);
    }
}