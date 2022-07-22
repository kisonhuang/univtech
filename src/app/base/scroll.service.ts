import {Inject, Injectable, OnDestroy} from '@angular/core';
import {DOCUMENT, Location, PlatformLocation, PopStateEvent, ViewportScroller} from '@angular/common';

import {fromEvent, Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {sessionStorageToken} from './storage.service';

type ScrollPosition = [number, number];

interface ScrollPositionPopStateEvent extends PopStateEvent {
    state?: { scrollPosition: ScrollPosition };
}

export const topMargin = 16;

@Injectable()
export class ScrollService implements OnDestroy {

    private _topOffset?: number | null;

    private _topOfPageElement?: HTMLElement;

    private onDestroy = new Subject<void>();

    poppedStateScrollPosition: ScrollPosition | null = null;

    supportManualScrollRestoration: boolean = !!window && ('scrollTo' in window) && ('pageXOffset' in window) && isScrollRestorationWritable();

    get topOffset() {
        if (!this._topOffset) {
            const toolbar = this.document.querySelector('.app-toolbar');
            this._topOffset = (toolbar && toolbar.clientHeight || 0) + topMargin;
        }
        return this._topOffset as number;
    }

    get topOfPageElement() {
        if (!this._topOfPageElement) {
            this._topOfPageElement = this.document.getElementById('top-of-page') || this.document.body;
        }
        return this._topOfPageElement;
    }

    constructor(private viewportScroller: ViewportScroller,
                private platformLocation: PlatformLocation,
                private location: Location,
                @Inject(DOCUMENT) private document: Document,
                @Inject(sessionStorageToken) private storage: Storage) {
        fromEvent(window, 'resize').pipe(takeUntil(this.onDestroy)).subscribe(() => this._topOffset = null);
        fromEvent(window, 'scroll').pipe(debounceTime(250), takeUntil(this.onDestroy)).subscribe(() => this.updateScrollPositionInHistory());
        fromEvent(window, 'beforeunload').pipe(takeUntil(this.onDestroy)).subscribe(() => this.updateScrollLocationHref());

        if (this.supportManualScrollRestoration) {
            history.scrollRestoration = 'manual';
            const locationSubscription = this.location.subscribe((event: ScrollPositionPopStateEvent) => this.scrollOrRemovePosition(event));
            this.onDestroy.subscribe(() => locationSubscription.unsubscribe());
        }

        if (window.location.href !== this.getStoredScrollLocationHref()) {
            this.removeStoredScrollInfo();
        }
    }

    ngOnDestroy() {
        this.onDestroy.next();
    }

    scroll() {
        const hash = this.getCurrentHash();
        const element = hash ? this.document.getElementById(hash) ?? null : this.topOfPageElement;
        this.scrollToElement(element);
    }

    scrollAfterRender(delay: number) {
        const storedScrollPosition = this.getStoredScrollPosition();
        if (storedScrollPosition) {
            this.viewportScroller.scrollToPosition(storedScrollPosition);
        } else {
            if (this.isNeedToFixScrollPosition()) {
                this.scrollToPosition();
            } else {
                if (this.isLocationWithHash()) {
                    setTimeout(() => this.scroll(), delay);
                } else {
                    this.scrollToTop();
                }
            }
        }
    }

    scrollToElement(element: HTMLElement | null) {
        if (element) {
            element.scrollIntoView();
            element.focus?.();

            if (window && window.scrollBy) {
                window.scrollBy(0, element.getBoundingClientRect().top - this.topOffset);
                if (window.pageYOffset < 20) {
                    window.scrollBy(0, -window.pageYOffset);
                }
            }
        }
    }

    scrollToTop() {
        this.scrollToElement(this.topOfPageElement);
    }

    scrollToPosition() {
        if (this.poppedStateScrollPosition) {
            this.viewportScroller.scrollToPosition(this.poppedStateScrollPosition);
            this.poppedStateScrollPosition = null;
        }
    }

    scrollOrRemovePosition(event: ScrollPositionPopStateEvent) {
        if (event.type === 'hashchange') {
            this.scrollToPosition();
        } else {
            this.removeStoredScrollInfo();
            this.poppedStateScrollPosition = event.state ? event.state.scrollPosition : null;
        }
    }

    updateScrollLocationHref(): void {
        this.storage.setItem('scrollLocationHref', window.location.href);
    }

    updateScrollPositionInHistory() {
        if (this.supportManualScrollRestoration) {
            const currentScrollPosition = this.viewportScroller.getScrollPosition();
            this.location.replaceState(this.location.path(true), undefined, {scrollPosition: currentScrollPosition});
            this.storage.setItem('scrollPosition', currentScrollPosition.join(','));
        }
    }

    isLocationWithHash(): boolean {
        return !!this.getCurrentHash();
    }

    isNeedToFixScrollPosition(): boolean {
        return this.supportManualScrollRestoration && !!this.poppedStateScrollPosition;
    }

    private getCurrentHash() {
        return decodeURIComponent(this.platformLocation.hash.replace(/^#/, ''));
    }

    getStoredScrollLocationHref(): string | null {
        const href = this.storage.getItem('scrollLocationHref');
        return href || null;
    }

    getStoredScrollPosition(): ScrollPosition | null {
        const position = this.storage.getItem('scrollPosition');
        if (!position) {
            return null;
        }

        const [x, y] = position.split(',');
        return [+x, +y];
    }

    removeStoredScrollInfo() {
        this.storage.removeItem('scrollLocationHref');
        this.storage.removeItem('scrollPosition');
    }

}

function isScrollRestorationWritable() {
    const scrollRestorationDescriptor = Object.getOwnPropertyDescriptor(history, 'scrollRestoration') || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(history), 'scrollRestoration');
    return scrollRestorationDescriptor !== undefined && !!(scrollRestorationDescriptor.writable || scrollRestorationDescriptor.set);
}
