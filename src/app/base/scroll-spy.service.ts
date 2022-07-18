import {Inject, Injectable} from '@angular/core';
import {DOCUMENT} from '@angular/common';

import {fromEvent, Observable, ReplaySubject, Subject} from 'rxjs';
import {auditTime, distinctUntilChanged, takeUntil} from 'rxjs/operators';

import {ScrollService} from './scroll.service';

/**
 * 滚动项
 */
export interface ScrollItem {

    // 元素索引
    index: number;

    // 滚动元素
    element: Element;

}

/**
 * 滚动监视信息
 */
export interface ScrollSpyInfo {

    // 不同滚动项的可观察对象
    active: Observable<ScrollItem | null>;

    // 停止跟踪元素组的方法
    unspy: () => void;

}

/*
 * 表示滚动被监视的滚动元素，包含基于窗口滚动位置，用于确定元素是否滚动的信息和方法
 */
export class ScrollSpiedElement implements ScrollItem {

    // 元素顶部滚动的距离
    top = 0;

    /**
     * 构造函数，创建滚动元素
     *
     * @param element 相对视窗位置被跟踪的滚动元素
     * @param index 原元素（组）列表中元素的索引
     */
    constructor(public readonly element: Element,
                public readonly index: number) {

    }

    /**
     * 计算元素顶部滚动的距离
     *
     * @param scrollTop 窗口垂直滚动的距离
     * @param topOffset 元素的顶部偏移量
     */
    calculateTop(scrollTop: number, topOffset: number) {
        this.top = scrollTop + this.element.getBoundingClientRect().top - topOffset;
    }

}

/*
 * 表示滚动被监视的滚动元素组
 *
 *
 * @prop {Observable<ScrollItem | null>} activeScrollItem -
 *
 * An observable that emits ScrollItem elements
 * (containing the HTML element and its original index)
 * identifying the latest "active" element from a list of elements.
 */
export class ScrollSpiedElementGroup {

    // 最后一个滚动元素
    activeScrollItem: ReplaySubject<ScrollItem | null> = new ReplaySubject(1);

    // 滚动被监视的滚动元素数组
    private spiedElements: ScrollSpiedElement[];

    /**
     * 构造函数，创建滚动元素组
     *
     * @param elements 相对视窗位置被跟踪的滚动元素数组
     */
    constructor(elements: Element[]) {
        this.spiedElements = elements.map((element, index) => new ScrollSpiedElement(element, index));
    }

    /*
     * @method
     * Caclulate the `top` value of each ScrollSpiedElement of this group (based on te current
     * `scrollTop` and `topOffset` values), so that the active element can be later determined just by
     * comparing its `top` property with the then current `scrollTop`.
     *
     * @param {number} scrollTop - How much is window currently scrolled (vertically).
     * @param {number} topOffset - The distance from the top at which the element becomes active.
     */
    calibrate(scrollTop: number, topOffset: number) {
        this.spiedElements.forEach(element => element.calculateTop(scrollTop, topOffset));
        this.spiedElements.sort((first, second) => second.top - first.top);
    }

    /*
     * Determine which element is the currently active one,
     * i.e. the lower-most element that is scrolled passed the top of the viewport (taking offsets into account) and emit it on `activeScrollItem`.
     *
     * If window is scrolled all the way to the bottom, then the lower-most element is considered active
     * even if it not scrolled passed the top of the viewport.
     *
     */

    /**
     * 确定当前活动的元素，
     *
     * @param scrollTop 窗口垂直滚动的高度
     * @param maxScrollTop 基于视窗大小的最大滚动高度
     */
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

        // 没有活动元素时，发送null
        this.activeScrollItem.next(activeItem || null);
    }
}

@Injectable()
export class ScrollSpyService {

    //
    private spiedElementGroups: ScrollSpiedElementGroup[] = [];

    //
    private onStopListening = new Subject<void>();

    // resize事件
    private resizeEvents = fromEvent(window, 'resize').pipe(auditTime(300), takeUntil(this.onStopListening));

    // scroll事件
    private scrollEvents = fromEvent(window, 'scroll').pipe(auditTime(10), takeUntil(this.onStopListening));

    // 最后的内容高度
    private lastContentHeight = 0;

    // 最后的最大滚动高度
    private lastMaxScrollTop = 0;

    /**
     * 构造函数，创建滚动监听服务
     *
     * @param document 文档对象
     * @param scrollService 滚动服务
     */
    constructor(@Inject(DOCUMENT) private document: any,
                private scrollService: ScrollService) {

    }

    /**
     * 获取内容高度
     */
    private getContentHeight() {
        return this.document.body.scrollHeight || Number.MAX_SAFE_INTEGER;
    }

    /**
     * 获取滚动高度
     */
    private getScrollTop() {
        return window && window.pageYOffset || 0;
    }

    /**
     * 获取顶部偏移量
     */
    private getTopOffset() {
        return this.scrollService.topOffset + 50;
    }

    /**
     * 获取视窗高度
     */
    private getViewportHeight() {
        return this.document.body.clientHeight || 0;
    }

    /**
     * 跟踪元素并发送活动元素，例如，视窗中当前可见的元素。
     * 没有待监视元素时，监听resize和scroll事件。
     *
     * @param elements 待跟踪元素
     * @return 滚动监听信息
     */
    spyOn(elements: Element[]): ScrollSpyInfo {
        if (!this.spiedElementGroups.length) {
            this.resizeEvents.subscribe(() => this.onResize());
            this.scrollEvents.subscribe(() => this.onScroll());
            this.onResize();
        }

        const scrollTop = this.getScrollTop();
        const topOffset = this.getTopOffset();
        const maxScrollTop = this.lastMaxScrollTop;

        const spiedGroup = new ScrollSpiedElementGroup(elements);
        spiedGroup.calibrate(scrollTop, topOffset);
        spiedGroup.onScroll(scrollTop, maxScrollTop);

        this.spiedElementGroups.push(spiedGroup);

        return {
            active: spiedGroup.activeScrollItem.asObservable().pipe(distinctUntilChanged()),
            unspy: () => this.unspy(spiedGroup)
        };
    }

    /**
     * 窗口大小发生改变，重新计算所有受影响的值，这样才能在滚动时有效地确定活动元素
     */
    private onResize() {
        const contentHeight = this.getContentHeight();
        const viewportHeight = this.getViewportHeight();
        const scrollTop = this.getScrollTop();
        const topOffset = this.getTopOffset();

        this.lastContentHeight = contentHeight;
        this.lastMaxScrollTop = contentHeight - viewportHeight;
        this.spiedElementGroups.forEach(group => group.calibrate(scrollTop, topOffset));
    }

    /*
     * @method
     * Determine which element for each ScrollSpiedElementGroup is active. If the content height has
     * changed since last check, re-calculate all affected values first.
     */
    private onScroll() {
        if (this.lastContentHeight !== this.getContentHeight()) {
            // Something has caused the scroll height to change.
            // (E.g. image downloaded, accordion expanded/collapsed etc.)
            this.onResize();
        }

        const scrollTop = this.getScrollTop();
        const maxScrollTop = this.lastMaxScrollTop;
        this.spiedElementGroups.forEach(group => group.onScroll(scrollTop, maxScrollTop));
    }

    /**
     * 停止跟踪元素组
     *
     * @param spiedElementGroup 被跟踪元素组
     */
    private unspy(spiedElementGroup: ScrollSpiedElementGroup) {
        // 停止发送活动元素
        spiedElementGroup.activeScrollItem.complete();

        // 删除被监视的元素组
        this.spiedElementGroups = this.spiedElementGroups.filter(group => group !== spiedElementGroup);

        // 不存在被监视的元素时，停止监听resize和scroll事件s
        if (!this.spiedElementGroups.length) {
            this.onStopListening.next();
        }
    }

}
