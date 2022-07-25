import {Inject, Injectable} from '@angular/core';
import {DOCUMENT} from '@angular/common';

import {Observable, Subject, ReplaySubject, fromEvent} from 'rxjs';
import {auditTime, distinctUntilChanged, takeUntil} from 'rxjs/operators';

import {ScrollService} from './scroll.service';

// 滚动元素
export interface ScrollItem {
    // 元素索引
    index: number;
    // 被监视的元素，为确定当前激活的滚动元素，元素相对于视窗的位置会被监视
    element: Element;
}

// 滚动监视器
export interface ScrollSpy {
    // 当前激活的滚动元素主题
    activeScrollItemObservable: Observable<ScrollItem | null>;
    // 停止监视滚动元素
    unspyScrollItems: () => void;
}

// 被监视的滚动元素
export class SpiedScrollItem implements ScrollItem {

    // 元素的滚动高度
    scrollHeight = 0;

    /**
     * 构造函数，创建被监视的滚动元素
     *
     * @param index 元素索引
     * @param element 被监视的元素
     */
    constructor(public readonly index: number, public readonly element: Element) {

    }

    /**
     * 计算元素的滚动高度
     *
     * @param windowScrollHeight 窗口的滚动高度
     * @param elementTopOffset 元素的顶部偏移量
     */
    calculateScrollHeight(windowScrollHeight: number, elementTopOffset: number) {
        this.scrollHeight = windowScrollHeight + this.element.getBoundingClientRect().top - elementTopOffset;
    }

}

// 被监视的滚动元素组
export class SpiedScrollItemGroup {

    // 被监视的滚动元素数组
    private spiedScrollItems: SpiedScrollItem[];

    // 当前激活的滚动元素主题
    activeScrollItemSubject: ReplaySubject<ScrollItem | null> = new ReplaySubject(1);

    /**
     * 构造函数，创建被监视的滚动元素组
     *
     * @param elements 被监视的元素数组
     */
    constructor(elements: Element[]) {
        this.spiedScrollItems = elements.map((element, index) => new SpiedScrollItem(index, element));
    }

    /**
     * 计算元素的滚动高度，并按元素的滚动高度逆序排序
     *
     * @param windowScrollHeight 窗口的滚动高度
     * @param elementTopOffset 元素的顶部偏移量
     */
    calculateScrollHeight(windowScrollHeight: number, elementTopOffset: number) {
        this.spiedScrollItems.forEach(spiedScrollItem => spiedScrollItem.calculateScrollHeight(windowScrollHeight, elementTopOffset));
        this.spiedScrollItems.sort((first, second) => second.scrollHeight - first.scrollHeight);
    }

    /**
     * 确定并发送当前激活的滚动元素
     *
     * @param windowScrollHeight 窗口的滚动高度
     * @param maxWindowScrollHeight 基于视窗大小的，窗口的最大滚动高度
     */
    sendActiveScrollItem(windowScrollHeight: number, maxWindowScrollHeight: number) {
        let activeScrollItem: ScrollItem | undefined;

        if (windowScrollHeight + 1 >= maxWindowScrollHeight) {
            // 窗口滚到底部时，最底层元素被认为是当前激活的滚动元素，即使元素没有滚过视窗顶部
            activeScrollItem = this.spiedScrollItems[0];
        } else {
            // 滚过视窗顶部的最底层元素被认为是当前激活的滚动元素
            this.spiedScrollItems.some(spiedScrollItem => {
                if (spiedScrollItem.scrollHeight <= windowScrollHeight) {
                    activeScrollItem = spiedScrollItem;
                    return true;
                }
                return false;
            });
        }

        // 无法确定当前激活的滚动元素时，发送null
        this.activeScrollItemSubject.next(activeScrollItem || null);
    }

}

/**
 * 滚动监听服务
 */
@Injectable()
export class ScrollSpyService {

    // 被监视的滚动元素组数组
    private spiedScrollItemGroups: SpiedScrollItemGroup[] = [];

    // 停止监听resize和scroll事件的主题
    private stopListenSubject = new Subject<void>();

    // resize事件
    private resizeEvent = fromEvent(window, 'resize').pipe(auditTime(300), takeUntil(this.stopListenSubject));

    // scroll事件
    private scrollEvent = fromEvent(window, 'scroll').pipe(auditTime(10), takeUntil(this.stopListenSubject));

    // 视窗的滚动高度
    private viewportScrollHeight = 0;

    // 窗口的最大滚动高度 = 视窗的滚动高度 - 视窗的高度
    private maxWindowScrollHeight = 0;

    /**
     * 构造函数，创建滚动监视服务
     *
     * @param document 文档对象
     * @param scrollService 滚动服务
     */
    constructor(@Inject(DOCUMENT) private document: Document, private scrollService: ScrollService) {

    }

    /**
     * 开始监视滚动元素，开始发送当前激活的滚动元素，不存在其他被监视的滚动元素组时，开始监听resize和scroll事件
     *
     * @param elements 被监视的元素数组
     * @return ScrollSpy 滚动监视器
     */
    spyScrollItems(elements: Element[]): ScrollSpy {
        if (!this.spiedScrollItemGroups.length) {
            this.resizeEvent.subscribe(() => this.calculateScrollHeight());
            this.scrollEvent.subscribe(() => this.sendActiveScrollItem());
            this.calculateScrollHeight();
        }

        const windowScrollHeight = this.getWindowScrollHeight();
        const elementTopOffset = this.getElementTopOffset();
        const maxWindowScrollHeight = this.maxWindowScrollHeight;

        const spiedScrollItemGroup = new SpiedScrollItemGroup(elements);
        spiedScrollItemGroup.calculateScrollHeight(windowScrollHeight, elementTopOffset);
        spiedScrollItemGroup.sendActiveScrollItem(windowScrollHeight, maxWindowScrollHeight);
        this.spiedScrollItemGroups.push(spiedScrollItemGroup);

        return {
            activeScrollItemObservable: spiedScrollItemGroup.activeScrollItemSubject.asObservable().pipe(distinctUntilChanged()),
            unspyScrollItems: () => this.unspyScrollItems(spiedScrollItemGroup)
        };
    }

    /**
     * 停止监视滚动元素，停止发送当前激活的滚动元素，不存在其他被监视的滚动元素组时，停止监听resize和scroll事件
     *
     * @param unspySpiedScrollItemGroup 停止监视的滚动元素组
     */
    private unspyScrollItems(unspySpiedScrollItemGroup: SpiedScrollItemGroup) {
        unspySpiedScrollItemGroup.activeScrollItemSubject.complete();
        this.spiedScrollItemGroups = this.spiedScrollItemGroups.filter(spiedScrollItemGroup => spiedScrollItemGroup !== unspySpiedScrollItemGroup);
        if (!this.spiedScrollItemGroups.length) {
            this.stopListenSubject.next();
        }
    }

    /**
     * 窗口大小发生改变，重新计算所有受影响的值，这样在滚动时才能有效地确定当前激活的滚动元素
     */
    private calculateScrollHeight() {
        const viewportHeight = this.getViewportHeight();
        const viewportScrollHeight = this.getViewportScrollHeight();
        const windowScrollHeight = this.getWindowScrollHeight();
        const elementTopOffset = this.getElementTopOffset();

        this.viewportScrollHeight = viewportScrollHeight;
        this.maxWindowScrollHeight = viewportScrollHeight - viewportHeight;
        this.spiedScrollItemGroups.forEach(spiedScrollItemGroup => spiedScrollItemGroup.calculateScrollHeight(windowScrollHeight, elementTopOffset));
    }

    /**
     * 确定并发送当前激活的滚动元素，视窗的滚动高度发生改变时，重新计算所有受影响的值
     */
    private sendActiveScrollItem() {
        // 图片下载、展开或折叠等都会改变视窗的滚动高度
        if (this.viewportScrollHeight !== this.getViewportScrollHeight()) {
            this.calculateScrollHeight();
        }
        const windowScrollHeight = this.getWindowScrollHeight();
        const maxWindowScrollHeight = this.maxWindowScrollHeight;
        this.spiedScrollItemGroups.forEach(spiedScrollItemGroup => spiedScrollItemGroup.sendActiveScrollItem(windowScrollHeight, maxWindowScrollHeight));
    }

    /**
     * 获取视窗的高度
     *
     * @return number 视窗的高度
     */
    private getViewportHeight() {
        return this.document.body.clientHeight || 0;
    }

    /**
     * 获取视窗的滚动高度
     *
     * @return number 视窗的滚动高度
     */
    private getViewportScrollHeight() {
        return this.document.body.scrollHeight || Number.MAX_SAFE_INTEGER;
    }

    /**
     * 获取窗口的滚动高度
     *
     * @return number 窗口的滚动高度
     */
    private getWindowScrollHeight() {
        return window && window.pageYOffset || 0;
    }

    /**
     * 获取元素的顶部偏移量
     *
     * @return number 元素的顶部偏移量
     */
    private getElementTopOffset() {
        return this.scrollService.topOffset + 50;
    }

}
