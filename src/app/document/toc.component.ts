import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren} from '@angular/core';

import {asapScheduler, combineLatest, Subject} from 'rxjs';
import {startWith, subscribeOn, takeUntil} from 'rxjs/operators';

import {ScrollService} from '../base/scroll.service';
import {TocItem, TocService} from '../base/toc.service';

type TocType = 'None' | 'Floating' | 'EmbeddedSimple' | 'EmbeddedExpandable';

@Component({
    selector: 'univ-toc',
    templateUrl: './toc.component.html',
})
export class TocComponent implements OnInit, AfterViewInit, OnDestroy {

    activeTocItemIndex: number | null = null;

    tocType: TocType = 'None';

    isCollapsed = true;

    isEmbedded = false;

    @ViewChildren('tocItem') private tocItemElements: QueryList<ElementRef>;
    private destroySubject = new Subject<void>();

    primaryMax = 4;

    tocItems: TocItem[];

    constructor(elementRef: ElementRef,
                private tocService: TocService,
                private scrollService: ScrollService) {
        this.isEmbedded = elementRef.nativeElement.className.indexOf('embedded') !== -1;
    }

    ngOnInit() {
        this.tocService.tocItemsSubject
            .pipe(takeUntil(this.destroySubject))
            .subscribe(tocItems => {
                this.tocItems = tocItems;
                const tocItemCount = countItems(this.tocItems, tocItem => tocItem.level !== 'h1');
                this.tocType = this.getTocType(tocItemCount);
            });
    }

    ngAfterViewInit() {
        if (!this.isEmbedded) {
            // We use the `asap` scheduler because updates to `activeItemIndex` are triggered by DOM changes,
            // which, in turn, are caused by the rendering that happened due to a ChangeDetection.
            // Without asap, we would be updating the model while still in a ChangeDetection handler,
            // which is disallowed by Angular.
            combineLatest([
                this.tocService.activeTocItemSubject.pipe(subscribeOn(asapScheduler)),
                this.tocItemElements.changes.pipe(startWith(this.tocItemElements)),
            ])
                .pipe(takeUntil(this.destroySubject))
                .subscribe(([index, items]) => {
                    this.activeTocItemIndex = index;
                    if (index === null || index >= items.length) {
                        return;
                    }

                    const e = items.toArray()[index].nativeElement;
                    const p = e.offsetParent;

                    const eRect = e.getBoundingClientRect();
                    const pRect = p.getBoundingClientRect();

                    const isInViewport = (eRect.top >= pRect.top) && (eRect.bottom <= pRect.bottom);

                    if (!isInViewport) {
                        p.scrollTop += (eRect.top - pRect.top) - (p.clientHeight / 2);
                    }
                });
        }
    }

    ngOnDestroy() {
        this.destroySubject.next();
    }

    toggle(canScroll = true) {
        this.isCollapsed = !this.isCollapsed;
        if (canScroll && this.isCollapsed) {
            this.scrollToTopElement();
        }
    }

    scrollToTopElement() {
        this.scrollService.scrollToTopElement();
    }

    private getTocType(tocItemCount: number): TocType {
        return (tocItemCount > 0) ? this.isEmbedded ? (tocItemCount > this.primaryMax) ? 'EmbeddedExpandable' : 'EmbeddedSimple' : 'Floating' : 'None';
    }

}

function countItems<T>(items: T[], checkItem: (item: T) => boolean): number {
    return items.reduce((count, item) => checkItem(item) ? count + 1 : count, 0);
}
