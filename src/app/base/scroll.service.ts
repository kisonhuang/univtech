import {Inject, Injectable, OnDestroy} from '@angular/core';
import {DOCUMENT, Location, PlatformLocation, ViewportScroller} from '@angular/common';

import {fromEvent, Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {sessionStorageToken} from './storage.service';
import {ScrollPosition, ScrollPositionPopStateEvent, topMargin} from './scroll.model';

/**
 * 滚动服务，把文档元素滚进视图中
 */
@Injectable()
export class ScrollService implements OnDestroy {

    // 元素的顶部偏移量
    private _topOffset?: number | null;

    // 页面顶部的元素
    private _topElement?: HTMLElement;

    // 销毁主题
    private destroySubject = new Subject<void>();

    // 滚动位置：popstate事件之后必须调整
    poppedStateScrollPosition: ScrollPosition | null = null;

    // 浏览器是否支持手动滚动调整功能：Window对象具有scrollTo方法和pageXOffset属性，并且history的scrollRestoration属性可写
    supportManualScrollRestoration: boolean = !!window && ('scrollTo' in window) && ('pageXOffset' in window) && isScrollRestorationWritable();

    /**
     * 获取元素的顶部偏移量：页面顶部的工具栏高度 + 顶部外边距
     */
    get topOffset() {
        if (!this._topOffset) {
            const toolbar = this.document.querySelector('.app-toolbar');
            this._topOffset = (toolbar && toolbar.clientHeight || 0) + topMargin;
        }
        return this._topOffset as number;
    }

    /**
     * 获取页面顶部的元素：id为top-of-page的元素或document.body
     */
    get topElement() {
        if (!this._topElement) {
            this._topElement = this.document.getElementById('top-of-page') || this.document.body;
        }
        return this._topElement;
    }

    /**
     * 构造函数，创建滚动服务
     *
     * @param viewportScroller 视窗滚动条，通过浏览器视窗滚动条实现的滚动位置管理器
     * @param platformLocation 平台定位器，封装DOM接口的调用，实现平台无关的路由器
     * @param location 定位器，用于与浏览器的URL进行交互
     * @param document 文档对象，浏览器加载的Web页面
     * @param storage 存储对象，用于访问特定领域的会话或本地存储
     */
    constructor(private viewportScroller: ViewportScroller,
                private platformLocation: PlatformLocation,
                private location: Location,
                @Inject(DOCUMENT) private document: Document,
                @Inject(sessionStorageToken) private storage: Storage) {
        // 调整大小时，页面顶部的工具栏高度可能会发生改变，因此把元素的顶部偏移量设置为null
        fromEvent(window, 'resize').pipe(takeUntil(this.destroySubject)).subscribe(() => this._topOffset = null);

        // 触发scroll事件滚动时，修改history中的滚动位置状态，修改存储对象中的滚动位置（scrollPosition）
        fromEvent(window, 'scroll').pipe(debounceTime(250), takeUntil(this.destroySubject)).subscribe(() => this.updateScrollPositionInHistory());

        // 触发beforeunload事件卸载之前，修改存储对象中的滚动位置链接（scrollLocationHref）
        fromEvent(window, 'beforeunload').pipe(takeUntil(this.destroySubject)).subscribe(() => this.updateScrollLocationHref());

        // 如果浏览器支持手动滚动调整功能，把滚动调整策略修改为手动（manual）
        if (this.supportManualScrollRestoration) {
            history.scrollRestoration = 'manual';

            // 因为存在popState事件，所以需要检测前进（forward）和后退（back）导航
            const locationSubscription = this.location.subscribe((event: ScrollPositionPopStateEvent) => this.scrollOrRemovePosition(event));
            this.destroySubject.subscribe(() => locationSubscription.unsubscribe());
        }

        // 不是重新加载，丢弃存储的滚动信息
        if (window.location.href !== this.getStoredScrollLocationHref()) {
            this.removeStoredScrollInfo();
        }
    }

    /**
     * 销毁之前的清理回调方法
     */
    ngOnDestroy() {
        this.destroySubject.next();
    }

    /**
     * 从当前位置的hash片段中提取元素id，滚动到元素。<br>
     * 当前位置中没有hash片段时，滚动到文档顶部。<br>
     * hash片段中没有找到元素id时，不需要滚动。
     */
    scroll() {
        const hash = this.getCurrentHash();
        const element = hash ? this.document.getElementById(hash) ?? null : this.topElement;
        this.scrollToElement(element);
    }

    /**
     * 刷新、点击前进或后退按钮、在地址栏输入URL、点击链接加载文档时，滚动到正确位置
     *
     * @param delay 延迟滚动时间（毫秒）
     */
    scrollAfterRender(delay: number) {
        // 刷新之后进行渲染时，使用存储的滚动位置
        const storedScrollPosition = this.getStoredScrollPosition();
        if (storedScrollPosition) {
            this.viewportScroller.scrollToPosition(storedScrollPosition);
        } else {
            if (this.isNeedToFixScrollPosition()) {
                // 点击前进或后退按钮触发popstate事件之后，文档被重新加载，需要管理滚动位置
                this.scrollToPosition();
            } else {
                // 加载文档的方式：在地址栏输入URL、点击链接
                if (this.isLocationWithHash()) {
                    // 位置中包含hash时，等待异步布局，按指定时间延迟滚动
                    setTimeout(() => this.scroll(), delay);
                } else {
                    // 位置中没有包含hash时，滚动到页面顶部
                    this.scrollToTop();
                }
            }
        }
    }

    /**
     * 滚动到指定元素，没有元素时不需要滚动
     */
    scrollToElement(element: HTMLElement | null) {
        if (element) {
            element.scrollIntoView();
            element.focus?.();

            if (window && window.scrollBy) {
                // 尽可能多地滚动，让元素顶部对齐到topOffset。
                // 通常.top为0，除非元素不能一直向上滚动到顶部，因为viewport比元素后面内容的高度大。
                window.scrollBy(0, element.getBoundingClientRect().top - this.topOffset);

                // 元素在页面顶部，但是元素的顶部外边距很小（小于20px）时，一直向上滚动到顶部
                if (window.pageYOffset < 20) {
                    window.scrollBy(0, -window.pageYOffset);
                }
            }
        }
    }

    /**
     * 滚动到文档顶部
     */
    scrollToTop() {
        this.scrollToElement(this.topElement);
    }

    /**
     * 滚动到popstate事件之后的目标位置
     */
    scrollToPosition() {
        if (this.poppedStateScrollPosition) {
            this.viewportScroller.scrollToPosition(this.poppedStateScrollPosition);
            this.poppedStateScrollPosition = null;
        }
    }

    /**
     * 处理滚动位置的弹出状态事件：<br>
     * 事件类型是hashchange时，滚动到目标位置。<br>
     * 事件类型不是hashchange时，从会话存储中删除位置。<br>
     *
     * @param event ScrollPositionPopStateEvent：滚动位置的弹出状态事件
     */
    scrollOrRemovePosition(event: ScrollPositionPopStateEvent) {
        if (event.type === 'hashchange') {
            // URL片段标识符改变时，事件类型为hashchange，可以在点击描点之前滚动到目标位置
            this.scrollToPosition();
        } else {
            // 使用前进或后退按钮导航时，从会话存储中删除位置，避免竞争条件
            // 点击前进或后退按钮等浏览器操作会触发popstate事件，popstate事件后可跟随hashchange事件
            this.removeStoredScrollInfo();
            this.poppedStateScrollPosition = event.state ? event.state.scrollPosition : null;
        }
    }

    /**
     * 修改存储对象中的滚动位置链接（scrollLocationHref）
     */
    updateScrollLocationHref(): void {
        this.storage.setItem('scrollLocationHref', window.location.href);
    }

    /**
     * 修改history中的滚动位置状态，修改存储对象中的滚动位置（scrollPosition）
     */
    updateScrollPositionInHistory() {
        if (this.supportManualScrollRestoration) {
            const currentScrollPosition = this.viewportScroller.getScrollPosition();
            // 把浏览器URL修改为指定的规范的URL，并替换平台history栈中最上面的条目
            this.location.replaceState(this.location.path(true), undefined, {scrollPosition: currentScrollPosition});
            this.storage.setItem('scrollPosition', currentScrollPosition.join(','));
        }
    }

    /**
     * 判断当前位置是否存在hash
     */
    isLocationWithHash(): boolean {
        return !!this.getCurrentHash();
    }

    /**
     * 判断popState事件之后是否需要手动固定滚动位置
     */
    isNeedToFixScrollPosition(): boolean {
        return this.supportManualScrollRestoration && !!this.poppedStateScrollPosition;
    }

    /**
     * 从PlatformLocation中获取hash片段，去掉开头的#
     */
    private getCurrentHash() {
        return decodeURIComponent(this.platformLocation.hash.replace(/^#/, ''));
    }

    /**
     * 获取存储的滚动位置链接（scrollLocationHref）
     */
    getStoredScrollLocationHref(): string | null {
        const href = this.storage.getItem('scrollLocationHref');
        return href || null;
    }

    /**
     * 获取存储的滚动位置（scrollPosition）
     */
    getStoredScrollPosition(): ScrollPosition | null {
        const position = this.storage.getItem('scrollPosition');
        if (!position) {
            return null;
        }

        const [x, y] = position.split(',');
        return [+x, +y];
    }

    /**
     * 删除存储的滚动信息：<br>
     * 删除存储的滚动位置链接（scrollLocationHref）<br>
     * 删除存储的滚动位置（scrollPosition）<br>
     */
    removeStoredScrollInfo() {
        this.storage.removeItem('scrollLocationHref');
        this.storage.removeItem('scrollPosition');
    }

}

/**
 * 根据history实例或原型中的scrollRestoration属性描述符是否可写或是否具有set方法，判断history的scrollRestoration属性是否可写
 */
function isScrollRestorationWritable() {
    const scrollRestorationDescriptor = Object.getOwnPropertyDescriptor(history, 'scrollRestoration') || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(history), 'scrollRestoration');
    return scrollRestorationDescriptor !== undefined && !!(scrollRestorationDescriptor.writable || scrollRestorationDescriptor.set);
}
