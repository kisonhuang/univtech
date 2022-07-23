import {Observable, ReplaySubject} from 'rxjs';

// 滚动元素
export interface ScrollItem {
    index: number;    // 元素索引
    element: Element; // 被监视的元素，为确定当前激活的滚动元素，元素相对于视窗的位置会被监视
}

// 滚动监视器
export interface ScrollSpy {
    activeScrollItemObservable: Observable<ScrollItem | null>; // 当前激活的滚动元素主题
    unspyScrollItems: () => void;                              // 停止监视滚动元素
}

// 被监视的滚动元素
export class SpiedScrollItem implements ScrollItem {

    // 元素的顶部滚动值
    topScroll = 0;

    /**
     * 构造函数，创建被监视的滚动元素
     *
     * @param index 元素索引
     * @param element 被监视的元素
     */
    constructor(public readonly index: number, public readonly element: Element) {

    }

    /**
     * 计算元素的顶部滚动值
     *
     * @param topScroll 窗口的顶部滚动值
     * @param topOffset 元素的顶部偏移量
     */
    calculateTopScroll(topScroll: number, topOffset: number) {
        this.topScroll = topScroll + this.element.getBoundingClientRect().top - topOffset;
    }

}

// 被监视的滚动元素数组
export class SpiedScrollItemGroup {

    // 被监视的滚动元素数组
    private spiedScrollItems: SpiedScrollItem[];

    // 当前激活的滚动元素主题
    activeScrollItemSubject: ReplaySubject<ScrollItem | null> = new ReplaySubject(1);

    /**
     * 构造函数，创建被监视的滚动元素数组
     *
     * @param elements 被监视的元素数组
     */
    constructor(elements: Element[]) {
        this.spiedScrollItems = elements.map((element, index) => new SpiedScrollItem(index, element));
    }

    /**
     * 计算元素的顶部滚动值，并按元素的顶部滚动值逆序排序
     *
     * @param topScroll 窗口的顶部滚动值
     * @param topOffset 元素的顶部偏移量
     */
    calculateTopScroll(topScroll: number, topOffset: number) {
        this.spiedScrollItems.forEach(spiedScrollItem => spiedScrollItem.calculateTopScroll(topScroll, topOffset));
        this.spiedScrollItems.sort((first, second) => second.topScroll - first.topScroll);
    }

    /**
     * 确定并发送当前激活的滚动元素
     *
     * @param topScroll 窗口的顶部滚动值
     * @param maxTopScroll 基于视窗大小的，窗口的最大顶部滚动值
     */
    sendActiveScrollItem(topScroll: number, maxTopScroll: number) {
        let activeScrollItem: ScrollItem | undefined;

        if (topScroll + 1 >= maxTopScroll) {
            // 窗口滚到底部时，最底层元素被认为是当前激活的滚动元素，即使元素没有滚过视窗顶部
            activeScrollItem = this.spiedScrollItems[0];
        } else {
            // 滚过视窗顶部的最底层元素被认为是当前激活的滚动元素
            this.spiedScrollItems.some(spiedScrollItem => {
                if (spiedScrollItem.topScroll <= topScroll) {
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
