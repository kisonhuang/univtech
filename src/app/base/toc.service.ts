import {Inject, Injectable} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

import {ReplaySubject} from 'rxjs';
import {unwrapHtmlForSink} from 'safevalues';

import {convertInnerHTML} from './security.service';
import {ScrollSpyInfo, ScrollSpyService} from './scroll-spy.service';

export interface TocItem {
    level: string;
    href: string;
    title: string;
    content: SafeHtml;
    isSecondary?: boolean;
}

@Injectable()
export class TocService {

    tocList = new ReplaySubject<TocItem[]>(1);

    activeItemIndex = new ReplaySubject<number | null>(1);

    private scrollSpyInfo: ScrollSpyInfo | null = null;

    constructor(@Inject(DOCUMENT) private document: any,
                private domSanitizer: DomSanitizer,
                private scrollSpyService: ScrollSpyService) {

    }

    genToc(docElement?: Element, docId = '') {
        this.resetScrollSpyInfo();

        if (!docElement) {
            this.tocList.next([]);
            return;
        }

        const headings = this.findTocHeadings(docElement);
        const idMap = new Map<string, number>();
        const tocList = headings.map(heading => {
            const {title, content} = this.extractHeadingSafeHtml(heading);
            return {
                level: heading.tagName.toLowerCase(),
                href: `${docId}#${this.getId(heading, idMap)}`,
                title,
                content,
            };
        });

        this.tocList.next(tocList);
        this.scrollSpyInfo = this.scrollSpyService.spyOn(headings);
        this.scrollSpyInfo.active.subscribe(item => this.activeItemIndex.next(item && item.index));
    }

    private extractHeadingSafeHtml(heading: HTMLHeadingElement) {
        const div: HTMLDivElement = this.document.createElement('div');
        div.innerHTML = unwrapHtmlForSink(convertInnerHTML(heading));
        div.querySelectorAll('.github-links, .header-link').forEach(link => link.remove());

        div.querySelectorAll('a').forEach(anchorLink => {
            const anchorParent = anchorLink.parentNode as Node;
            while (anchorLink.childNodes.length) {
                anchorParent.insertBefore(anchorLink.childNodes[0], anchorLink);
            }
            anchorLink.remove();
        });

        return {
            content: this.domSanitizer.bypassSecurityTrustHtml(div.innerHTML.trim()),
            title: (div.textContent || '').trim(),
        };
    }

    private findTocHeadings(docElement: Element): HTMLHeadingElement[] {
        const headings = docElement.querySelectorAll<HTMLHeadingElement>('h1,h2,h3');
        const skipNoTocHeadings = (heading: HTMLHeadingElement) => !/(?:no-toc|notoc)/i.test(heading.className);
        return Array.prototype.filter.call(headings, skipNoTocHeadings);
    }

    reset() {
        this.resetScrollSpyInfo();
        this.tocList.next([]);
    }

    private resetScrollSpyInfo() {
        if (this.scrollSpyInfo) {
            this.scrollSpyInfo.unspy();
            this.scrollSpyInfo = null;
        }
        this.activeItemIndex.next(null);
    }

    private getId(heading: HTMLHeadingElement, idMap: Map<string, number>) {
        let id = heading.id;
        if (id) {
            addToMap(id);
        } else {
            id = (heading.textContent || '').trim().toLowerCase().replace(/\W+/g, '-');
            id = addToMap(id);
            heading.id = id;
        }
        return id;

        function addToMap(hId: string) {
            const oldCount = idMap.get(hId) || 0;
            const newCount = oldCount + 1;
            idMap.set(hId, newCount);
            return newCount === 1 ? hId : `${hId}-${newCount}`;
        }
    }

}
