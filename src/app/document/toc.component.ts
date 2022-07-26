import {Component, OnInit, AfterViewInit, OnDestroy, ViewChildren, QueryList, ElementRef} from '@angular/core';

import {Subject, combineLatest, asapScheduler} from 'rxjs';
import {takeUntil, subscribeOn, startWith} from 'rxjs/operators';

import {ScrollService} from '../base/scroll.service';
import {TocItem, TocService} from '../base/toc.service';

type TocType = 'None' | 'Floating' | 'EmbeddedSimple' | 'EmbeddedExpandable';

@Component({
    selector: 'univ-toc',
    templateUrl: './toc.component.html',
})
export class TocComponent implements OnInit, AfterViewInit, OnDestroy {

    tocItems: TocItem[];

    tocType: TocType = 'None';

    activeTocItemIndex: number | null = null;

    primaryMax = 4;

    isCollapsed = true;

    isEmbedded = false;

    @ViewChildren('tocItem') private tocItemElements: QueryList<ElementRef>;
    private destroySubject = new Subject<void>();

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

    // We use the `asap` scheduler because updates to `activeItemIndex` are triggered by DOM changes,
    // which, in turn, are caused by the rendering that happened due to a ChangeDetection.
    // Without asap, we would be updating the model while still in a ChangeDetection handler,
    // which is disallowed by Angular.
    ngAfterViewInit() {
        if (!this.isEmbedded) {
            combineLatest([
                this.tocService.activeTocItemSubject.pipe(subscribeOn(asapScheduler)),
                this.tocItemElements.changes.pipe(startWith(this.tocItemElements)),
            ])
                .pipe(takeUntil(this.destroySubject))
                .subscribe(([activeTocItemIndex, tocItemElements]) => {
                    this.activeTocItemIndex = activeTocItemIndex;
                    if (activeTocItemIndex === null || activeTocItemIndex >= tocItemElements.length) {
                        return;
                    }

                    const tocItemElement = tocItemElements.toArray()[activeTocItemIndex].nativeElement;
                    const tocItemParentElement = tocItemElement.offsetParent;

                    const tocItemElementRect = tocItemElement.getBoundingClientRect();
                    const tocItemParentElementRect = tocItemParentElement.getBoundingClientRect();

                    const isInViewport = (tocItemElementRect.top >= tocItemParentElementRect.top) && (tocItemElementRect.bottom <= tocItemParentElementRect.bottom);
                    if (!isInViewport) {
                        tocItemParentElement.scrollTop += (tocItemElementRect.top - tocItemParentElementRect.top) - (tocItemParentElement.clientHeight / 2);
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
