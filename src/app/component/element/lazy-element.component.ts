import {Component, ElementRef, Input, OnInit} from '@angular/core';

import {LogService} from '../../base/log.service';
import {ElementLoadService} from './element-load.service';

@Component({
    selector: 'univ-lazy-element',
    template: '',
})
export class LazyElementComponent implements OnInit {

    @Input() selector = '';

    constructor(private elementRef: ElementRef,
                private elementLoadService: ElementLoadService,
                private logService: LogService) {

    }

    ngOnInit() {
        if (!this.selector || /[^\w-]/.test(this.selector)) {
            this.logService.error(new Error(`Invalid selector for 'aio-lazy-ce': ${this.selector}`));
            return;
        }

        this.elementRef.nativeElement.textContent = '';
        this.elementRef.nativeElement.appendChild(document.createElement(this.selector));
        this.elementLoadService.loadCustomElement(this.selector);
    }

}
