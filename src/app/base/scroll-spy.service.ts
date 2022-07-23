import {Inject, Injectable} from '@angular/core';
import {DOCUMENT} from '@angular/common';

import {fromEvent, Subject} from 'rxjs';
import {auditTime, distinctUntilChanged, takeUntil} from 'rxjs/operators';

import {ScrollSpy, SpiedScrollItemGroup} from './scroll.model';
import {ScrollService} from './scroll.service';

@Injectable()
export class ScrollSpyService {

    private spiedElementGroups: SpiedScrollItemGroup[] = [];

    private onStopListening = new Subject<void>();

    private resizeEvents = fromEvent(window, 'resize').pipe(auditTime(300), takeUntil(this.onStopListening));

    private scrollEvents = fromEvent(window, 'scroll').pipe(auditTime(10), takeUntil(this.onStopListening));

    private lastContentHeight = 0;

    private lastMaxScrollTop = 0;

    constructor(@Inject(DOCUMENT) private document: any, private scrollService: ScrollService) {

    }

    private getContentHeight() {
        return this.document.body.scrollHeight || Number.MAX_SAFE_INTEGER;
    }

    private getScrollTop() {
        return window && window.pageYOffset || 0;
    }

    private getTopOffset() {
        return this.scrollService.topOffset + 50;
    }

    private getViewportHeight() {
        return this.document.body.clientHeight || 0;
    }

    spyOn(elements: Element[]): ScrollSpy {
        if (!this.spiedElementGroups.length) {
            this.resizeEvents.subscribe(() => this.onResize());
            this.scrollEvents.subscribe(() => this.onScroll());
            this.onResize();
        }

        const scrollTop = this.getScrollTop();
        const topOffset = this.getTopOffset();
        const maxScrollTop = this.lastMaxScrollTop;

        const spiedGroup = new SpiedScrollItemGroup(elements);
        spiedGroup.calculateTopScroll(scrollTop, topOffset);
        spiedGroup.sendActiveScrollItem(scrollTop, maxScrollTop);

        this.spiedElementGroups.push(spiedGroup);

        return {
            activeScrollItemObservable: spiedGroup.activeScrollItemSubject.asObservable().pipe(distinctUntilChanged()),
            unspyScrollItems: () => this.unspy(spiedGroup)
        };
    }

    private onResize() {
        const contentHeight = this.getContentHeight();
        const viewportHeight = this.getViewportHeight();
        const scrollTop = this.getScrollTop();
        const topOffset = this.getTopOffset();

        this.lastContentHeight = contentHeight;
        this.lastMaxScrollTop = contentHeight - viewportHeight;
        this.spiedElementGroups.forEach(group => group.calculateTopScroll(scrollTop, topOffset));
    }

    private onScroll() {
        if (this.lastContentHeight !== this.getContentHeight()) {
            this.onResize();
        }
        const scrollTop = this.getScrollTop();
        const maxScrollTop = this.lastMaxScrollTop;
        this.spiedElementGroups.forEach(group => group.sendActiveScrollItem(scrollTop, maxScrollTop));
    }

    private unspy(spiedElementGroup: SpiedScrollItemGroup) {
        spiedElementGroup.activeScrollItemSubject.complete();
        this.spiedElementGroups = this.spiedElementGroups.filter(group => group !== spiedElementGroup);
        if (!this.spiedElementGroups.length) {
            this.onStopListening.next();
        }
    }

}
