import {Inject, Injectable} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

import {ReplaySubject} from 'rxjs';
import {unwrapHtmlForSink} from 'safevalues';

import {fromInnerHTML} from './security.service';
import {ScrollSpyInfo, ScrollSpyService} from './scroll-spy.service';

/**
 * 目录项
 */
export interface TocItem {

    // 级别
    level: string;

    // 链接
    href: string;

    // 标题
    title: string;

    // 内容
    content: SafeHtml;

    // 是否第二级目录
    isSecondary?: boolean;

}

/**
 * 目录服务
 */
@Injectable()
export class TocService {

    // 目录列表
    tocList = new ReplaySubject<TocItem[]>(1);

    // 活动项索引
    activeItemIndex = new ReplaySubject<number | null>(1);

    // 滚动监听信息
    private scrollSpyInfo: ScrollSpyInfo | null = null;

    /**
     * 构造函数，创建目录服务
     *
     * @param document 文档对象
     * @param domSanitizer DOM处理器，把值处理成不同DOM上下文中可安全使用的值，防止跨站点脚本安全漏洞（XSS）
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

    /**
     * 把HTML转换为可以在ToC中安全使用的内容：
     * + 删除自动生成的.github-links和.header-link元素及其内容
     * + 把a元素的内容移到a元素的父节点中（添加到a元素前面），保留a元素的内容，删除a元素
     * + 绕过安全性，把div.innerHTML认为是安全的HTML，转换为SafeHtml
     *
     * @param heading HTML标题元素
     */
    private extractHeadingSafeHtml(heading: HTMLHeadingElement) {
        const div: HTMLDivElement = this.document.createElement('div');
        div.innerHTML = unwrapHtmlForSink(fromInnerHTML(heading));

        // 删除自动生成的.github-links和.header-link元素及其内容
        div.querySelectorAll('.github-links, .header-link').forEach(link => link.remove());

        // 把a元素的内容移到a元素的父节点中（添加到a元素前面），保留a元素的内容，删除a元素
        div.querySelectorAll('a').forEach(anchorLink => {
            const anchorParent = anchorLink.parentNode as Node;
            while (anchorLink.childNodes.length) {
                anchorParent.insertBefore(anchorLink.childNodes[0], anchorLink);
            }
            anchorLink.remove();
        });

        return {
            // 绕过安全性，把div.innerHTML认为是安全的HTML，转换为SafeHtml
            content: this.domSanitizer.bypassSecurityTrustHtml(div.innerHTML.trim()),
            title: (div.textContent || '').trim(),
        };
    }

    /**
     * 找出目录标题
     *
     * @param docElement 文档元素
     * @return HTML标题元素
     */
    private findTocHeadings(docElement: Element): HTMLHeadingElement[] {
        const headings = docElement.querySelectorAll<HTMLHeadingElement>('h1,h2,h3');
        const skipNoTocHeadings = (heading: HTMLHeadingElement) => !/(?:no-toc|notoc)/i.test(heading.className);
        return Array.prototype.filter.call(headings, skipNoTocHeadings);
    }

    /**
     * 重置：
     * + 重置滚动监听信息
     * + 重置活动项索引
     * + 重置目录列表
     */
    reset() {
        this.resetScrollSpyInfo();
        this.tocList.next([]);
    }

    /**
     * 重置：
     * + 重置滚动监听信息
     * + 重置活动项索引
     */
    private resetScrollSpyInfo() {
        if (this.scrollSpyInfo) {
            this.scrollSpyInfo.unspy();
            this.scrollSpyInfo = null;
        }
        this.activeItemIndex.next(null);
    }

    /**
     * 从h1~h6标题中获取id，id不存在时创建id
     *
     * @param heading h1~h6标题元素
     * @param idMap id Map：key：标题id，value：出现次数
     */
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

        // 把标题id添加到Map中，防止创建重复id，返回值：hId、hId-2...
        function addToMap(hId: string) {
            const oldCount = idMap.get(hId) || 0;
            const newCount = oldCount + 1;
            idMap.set(hId, newCount);
            return newCount === 1 ? hId : `${hId}-${newCount}`;
        }
    }

}
