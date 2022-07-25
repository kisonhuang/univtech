import {PopStateEvent} from '@angular/common';
import {Observable, ReplaySubject} from 'rxjs';

// 顶部外边距
export const topMargin = 16;

// 滚动位置：[x, y]坐标
export type ScrollPosition = [number, number];

// PopStateEvent：popstate事件；
// ScrollPositionPopStateEvent：包含滚动位置的popstate事件。
export interface ScrollPositionPopStateEvent extends PopStateEvent {
    // 存在历史状态时，总是包含滚动位置
    state?: { scrollPosition: ScrollPosition };
}

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
