import {Inject, Injectable} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

import {ReplaySubject} from 'rxjs';
import {unwrapHtmlForSink} from 'safevalues';

import {convertInnerHTML} from './security.service';
import {ScrollSpy} from './scroll.model';
import {ScrollSpyService} from './scroll-spy.service';

// 目录项
export interface TocItem {
    // 目录级别
    level: string;
    // 目录链接
    href: string;
    // 目录标题
    title: string;
    // 目录内容
    content: SafeHtml;
    // 是否二级目录
    isSecondary?: boolean;
}

/**
 * 目录服务
 */
@Injectable()
export class TocService {

    // 目录列表主题
    tocItemsSubject = new ReplaySubject<TocItem[]>(1);

    // 当前激活目录主题
    activeTocItemSubject = new ReplaySubject<number | null>(1);

    // 滚动监视器
    private scrollSpy: ScrollSpy | null = null;

    /**
     * 构造函数，创建目录服务
     *
     * @param document 文档对象
     * @param domSanitizer DOM处理器，把值处理为可以在不同DOM上下文中安全使用的值，防止跨站点脚本的安全漏洞（XSS）
     * @param scrollSpyService 滚动监视服务
     */
    constructor(@Inject(DOCUMENT) private document: Document,
                private domSanitizer: DomSanitizer,
                private scrollSpyService: ScrollSpyService) {

    }

    /**
     * 生成目录列表
     *
     * @param docElement 文档元素
     * @param docId 文档id
     */
    generateTocItems(docElement?: Element, docId: string = '') {
        this.resetActiveTocItem();

        if (!docElement) {
            this.tocItemsSubject.next([]);
            return;
        }

        const headingMap = new Map<string, number>();
        const headingElements = this.getHeadingElements(docElement);
        const tocItems = headingElements.map(headingElement => {
            const tocItem = this.getTocItemContent(headingElement);
            return {
                ...tocItem,
                level: headingElement.tagName.toLowerCase(),
                href: `${docId}#${this.getHeadingId(headingElement, headingMap)}`,
            };
        });

        this.tocItemsSubject.next(tocItems);
        this.scrollSpy = this.scrollSpyService.spyScrollItems(headingElements);
        this.scrollSpy.activeScrollItemObservable.subscribe(scrollItem => this.activeTocItemSubject.next(scrollItem && scrollItem.index));
    }

    /**
     * 重置滚动监视器、当前激活目录和目录列表
     */
    resetTocItems() {
        this.resetActiveTocItem();
        this.tocItemsSubject.next([]);
    }

    /**
     * 重置滚动监视器和当前激活目录
     */
    private resetActiveTocItem() {
        if (this.scrollSpy) {
            this.scrollSpy.unspyScrollItems();
            this.scrollSpy = null;
        }
        this.activeTocItemSubject.next(null);
    }

    /**
     * 获取h1~h3标题元素，过滤掉没有目录的标题元素
     *
     * @param docElement 文档元素
     * @return HTMLHeadingElement[] h1~h3标题元素数组
     */
    private getHeadingElements(docElement: Element): HTMLHeadingElement[] {
        const headingElements = docElement.querySelectorAll<HTMLHeadingElement>('h1,h2,h3');
        const notocHeadingElementFilter = (headingElement: HTMLHeadingElement) => !/(?:no-toc|notoc)/i.test(headingElement.className);
        return Array.prototype.filter.call(headingElements, notocHeadingElementFilter);
    }

    /**
     * 获取目录标题和内容
     *
     * @param headingElement h1~h3标题元素
     * @return TocItem 目录标题和内容
     */
    private getTocItemContent(headingElement: HTMLHeadingElement) {
        const divElement: HTMLDivElement = this.document.createElement('div');
        divElement.innerHTML = unwrapHtmlForSink(convertInnerHTML(headingElement));

        // 删除自动生成的.github-links和.header-link元素及其内容
        divElement.querySelectorAll('.github-links, .header-link').forEach(linkElement => linkElement.remove());

        // 把a元素的内容添加到父节点中a元素的前面，保留a元素的内容，然后删除a元素
        divElement.querySelectorAll('a').forEach(anchorElement => {
            const anchorParentNode = anchorElement.parentNode as Node;
            while (anchorElement.childNodes.length) {
                anchorParentNode.insertBefore(anchorElement.childNodes[0], anchorElement);
            }
            anchorElement.remove();
        });

        return {
            title: (divElement.textContent || '').trim(),
            // 绕过安全性，把div元素的innerHTML看作可信任的HTML，并转换为SafeHtml
            content: this.domSanitizer.bypassSecurityTrustHtml(divElement.innerHTML.trim()),
        };
    }

    /**
     * 获取标题id，标题id不存在时，自动创建标题id
     *
     * @param headingElement h1~h3标题元素
     * @param headingMap 标题映射，key：标题id，value：标题次数
     */
    private getHeadingId(headingElement: HTMLHeadingElement, headingMap: Map<string, number>) {
        let headingId = headingElement.id;
        if (headingId) {
            this.addHeadingId(headingId, headingMap);
        } else {
            headingId = (headingElement.textContent || '').trim().toLowerCase().replace(/\W+/g, '-');
            headingId = this.addHeadingId(headingId, headingMap);
            headingElement.id = headingId;
        }
        return headingId;
    }

    /**
     * 把标题id添加到标题映射中，防止重复创建标题id
     *
     * @param headingId 标题id
     * @param headingMap 标题映射，key：标题id，value：标题次数
     * @return string 标题id、标题id-2...
     */
    private addHeadingId(headingId: string, headingMap: Map<string, number>): string {
        const headingCount = (headingMap.get(headingId) || 0) + 1;
        headingMap.set(headingId, headingCount);
        return headingCount === 1 ? headingId : `${headingId}-${headingCount}`;
    }

}
