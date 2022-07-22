import {Observable, ReplaySubject} from 'rxjs';

export interface ScrollItem {
    index: number;
    element: Element;
}

export interface ScrollSpyInfo {
    active: Observable<ScrollItem | null>;
    unspy: () => void;
}

export class ScrollSpiedElement implements ScrollItem {
    top = 0;

    constructor(public readonly element: Element, public readonly index: number) {

    }

    calculateTop(scrollTop: number, topOffset: number) {
        this.top = scrollTop + this.element.getBoundingClientRect().top - topOffset;
    }

}

export class ScrollSpiedElementGroup {

    activeScrollItem: ReplaySubject<ScrollItem | null> = new ReplaySubject(1);

    private spiedElements: ScrollSpiedElement[];

    constructor(elements: Element[]) {
        this.spiedElements = elements.map((element, index) => new ScrollSpiedElement(element, index));
    }

    calibrate(scrollTop: number, topOffset: number) {
        this.spiedElements.forEach(element => element.calculateTop(scrollTop, topOffset));
        this.spiedElements.sort((first, second) => second.top - first.top);
    }

    onScroll(scrollTop: number, maxScrollTop: number) {
        let activeItem: ScrollItem | undefined;
        if (scrollTop + 1 >= maxScrollTop) {
            activeItem = this.spiedElements[0];
        } else {
            this.spiedElements.some(element => {
                if (element.top <= scrollTop) {
                    activeItem = element;
                    return true;
                }
                return false;
            });
        }
        this.activeScrollItem.next(activeItem || null);
    }

}
