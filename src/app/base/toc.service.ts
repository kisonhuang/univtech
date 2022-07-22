import {Inject, Injectable} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {DomSanitizer} from '@angular/platform-browser';

import {ReplaySubject} from 'rxjs';
import {unwrapHtmlForSink} from 'safevalues';

import {convertInnerHTML} from './security.service';
import {ScrollSpyInfo, ScrollSpyService} from './scroll-spy.service';
import {TocItem} from './toc.model';

/**
 * 目录服务
 */
@Injectable()
export class TocService {

    // 目录主题
    tocItemSubject = new ReplaySubject<TocItem[]>(1);

    // 当前激活目录主题
    activeTocItemSubject = new ReplaySubject<number | null>(1);

    // 滚动监听信息
    private scrollSpyInfo: ScrollSpyInfo | null = null;

    /**
     * 构造函数，创建目录服务
     *
     * @param document 文档对象
     * @param domSanitizer DOM处理器，把值处理为在不同DOM上下文中可以安全使用的值，防止跨站点脚本的安全漏洞（XSS）
     * @param scrollSpyService 滚动监听服务
     */
    constructor(@Inject(DOCUMENT) private document: any,
                private domSanitizer: DomSanitizer,
                private scrollSpyService: ScrollSpyService) {

    }

    /**
     * 生成目录
     *
     * @param docElement 文档元素
     * @param docId 文档id
     */
    generateTocItems(docElement?: Element, docId: string = '') {
        this.resetActiveTocItem();

        if (!docElement) {
            this.tocItemSubject.next([]);
            return;
        }

        const headings = this.getTocHeadings(docElement);
        const headingMap = new Map<string, number>();
        const tocItems = headings.map(heading => {
            const {title, content} = this.extractHeadingSafeHtml(heading);
            return {
                level: heading.tagName.toLowerCase(),
                href: `${docId}#${this.getHeadingId(heading, headingMap)}`,
                title,
                content,
            };
        });

        this.tocItemSubject.next(tocItems);
        this.scrollSpyInfo = this.scrollSpyService.spyOn(headings);
        this.scrollSpyInfo.active.subscribe(item => this.activeTocItemSubject.next(item && item.index));
    }

    /**
     * 把HTML转换为可以在ToC中安全使用的内容：
     * + 删除自动生成的.github-links和.header-link元素及其内容
     * + 把a元素的内容移到a元素的父节点中（添加到a元素前面），保留a元素的内容，删除a元素
     * + 绕过安全性，把div.innerHTML认为是安全的HTML，转换为SafeHtml
     *
     * @param headingElement HTML标题元素
     */
    private extractHeadingSafeHtml(headingElement: HTMLHeadingElement) {
        const divElement: HTMLDivElement = this.document.createElement('div');
        divElement.innerHTML = unwrapHtmlForSink(convertInnerHTML(headingElement));

        // 删除自动生成的.github-links和.header-link元素及其内容
        divElement.querySelectorAll('.github-links, .header-link').forEach(link => link.remove());

        // 把a元素的内容移到a元素的父节点中（添加到a元素前面），保留a元素的内容，删除a元素
        divElement.querySelectorAll('a').forEach(anchorLink => {
            const anchorParent = anchorLink.parentNode as Node;
            while (anchorLink.childNodes.length) {
                anchorParent.insertBefore(anchorLink.childNodes[0], anchorLink);
            }
            anchorLink.remove();
        });

        return {
            // 绕过安全性，把div.innerHTML认为是安全的HTML，转换为SafeHtml
            content: this.domSanitizer.bypassSecurityTrustHtml(divElement.innerHTML.trim()),
            title: (divElement.textContent || '').trim(),
        };
    }

    /**
     * 获取h1~h3标题元素，过滤掉没有目录的标题
     *
     * @param docElement 文档元素
     * @return HTMLHeadingElement[] h1~h3标题元素数组
     */
    private getTocHeadings(docElement: Element): HTMLHeadingElement[] {
        const headings = docElement.querySelectorAll<HTMLHeadingElement>('h1,h2,h3');
        const noTocHeadingFilter = (heading: HTMLHeadingElement) => !/(?:no-toc|notoc)/i.test(heading.className);
        return Array.prototype.filter.call(headings, noTocHeadingFilter);
    }

    /**
     * 重置滚动监听信息、当前激活目录、目录列表
     */
    resetTocItems() {
        this.resetActiveTocItem();
        this.tocItemSubject.next([]);
    }

    /**
     * 重置滚动监听信息、当前激活目录
     */
    private resetActiveTocItem() {
        if (this.scrollSpyInfo) {
            this.scrollSpyInfo.unspy();
            this.scrollSpyInfo = null;
        }
        this.activeTocItemSubject.next(null);
    }

    /**
     * 获取标题id，标题id不存在时，自动创建标题id
     *
     * @param headingElement h1~h6标题元素
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
