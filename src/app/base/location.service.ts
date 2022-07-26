import {Injectable} from '@angular/core';
import {PlatformLocation, Location} from '@angular/common';

import {ReplaySubject} from 'rxjs';
import {map, tap} from 'rxjs/operators';

import {GoogleService} from './google.service';
import {ScrollService} from './scroll.service';

/**
 * 地址服务
 */
@Injectable()
export class LocationService {

    // 是否需要加载整个页面，true：需要加载整个页面；false：不需要加载整个页面
    private isNeededToLoadFullPage = false;

    // 当前链接元素
    private readonly currentAnchorElement = document.createElement('a');

    // 当前地址主题
    private currentUrlSubject = new ReplaySubject<string>(1);

    // 当前地址主题：去掉路径中的特殊字符
    currentUrlObservable = this.currentUrlSubject.pipe(map(url => this.stripSpecialChars(url)));

    // 当前地址主题：去掉路径中的查询参数和hash片段
    currentPathObservable = this.currentUrlObservable.pipe(map(url => (url.match(/[^?#]*/) || [])[0]), tap(url => this.googleService.changeLocation(url)));

    /**
     * 构造函数，创建地址服务
     *
     * @param platformLocation 平台定位器，封装DOM接口的调用，实现平台无关的路由器
     * @param location 定位器，用于与浏览器的URL进行交互
     * @param googleService 谷歌服务
     * @param scrollService 滚动服务
     */
    constructor(private platformLocation: PlatformLocation,
                private location: Location,
                private googleService: GoogleService,
                private scrollService: ScrollService) {
        this.currentUrlSubject.next(location.path(true));
        this.location.subscribe(event => this.currentUrlSubject.next(event.url || ''));
    }

    /**
     * 处理链接的点击事件。
     * 因为使用地址服务在文档之间进行导航，浏览器不重新加载页面，所以必须拦截链接的点击事件。
     * 如果链接指向将要显示的文档，那么使用gotoUrl进行导航，并告诉浏览器不需要处理链接的点击事件。
     * 大多数应用程序可能都会在链接上添加的LinkDirective中这么做，但是这个应用程序存在一个特殊情况，
     * DocViewerComponent显示的是不能包含指令的半静态内容，所以内容中的所有链接都不能使用LinkDirective。
     * 因此AppComponent中添加了一个所有元素的点击事件处理器，用于捕获DocViewerComponent内外所有链接的点击事件。
     *
     * @param anchorElement 点击的链接
     * @param mouseClicks 鼠标的点击次数，0：点击鼠标左键或没有点击鼠标
     * @param ctrlPressed 是否按下Ctrl键，true：按下了Ctrl键；false：没有按下Ctrl键
     * @param metaPressed 是否按下Alt键或窗口键，true：按下了Alt键或窗口键；false：没有按下Alt键或窗口键
     * @return boolean true：让浏览器处理链接的点击事件；false：使用gotoUrl进行导航，浏览器不需要处理链接的点击事件
     */
    handleAnchorClick(anchorElement: HTMLAnchorElement, mouseClicks = 0, ctrlPressed = false, metaPressed = false): boolean {
        // 点击非鼠标左键，或者按下了Ctrl键，或者按下了Alt键或窗口键时，让浏览器处理链接的点击事件
        if (mouseClicks !== 0 || ctrlPressed || metaPressed) {
            return true;
        }

        // 链接中target属性的值不是_self时，让浏览器处理链接的点击事件
        const anchorTarget = anchorElement.target;
        if (anchorTarget && anchorTarget !== '_self') {
            return true;
        }

        // 链接中存在download属性时，让浏览器处理链接的点击事件
        if (anchorElement.getAttribute('download') != null) {
            return true;
        }

        // 修复页内链接，页内链接应该指向页内片段，因为基础路径已经被设置为`/`，所以相对于根路径`/`来进行路径解析
        // 参考：https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base#in-page_anchors
        const isInPageAnchor = anchorElement.getAttribute('href')?.startsWith('#') ?? false;
        const pathname = isInPageAnchor ? this.location.path() : anchorElement.pathname;
        const anchorHref = pathname + anchorElement.search + anchorElement.hash;
        this.currentAnchorElement.href = anchorHref;

        // 链接是外部链接，或者链接中存在扩展名时，让浏览器处理链接的点击事件
        if ((!isInPageAnchor && anchorElement.href !== this.currentAnchorElement.href) || !/\/[^/.]*$/.test(anchorElement.pathname)) {
            return true;
        }

        // 使用gotoUrl进行导航，浏览器不需要处理链接的点击事件
        this.gotoUrl(anchorHref);
        return false;
    }

    /**
     * 跳转到指定路径
     *
     * @param url 路径
     */
    gotoUrl(url: string | null | undefined): void {
        if (!url) {
            return;
        }
        url = this.stripSpecialChars(url);
        if (/^http/.test(url)) {
            // 包含http协议时，加载整个页面
            this.gotoExternalUrl(url);
        } else if (this.isNeededToLoadFullPage) {
            // 加载整个页面时，删除存储的滚动地址和滚动位置，确保滚动到页面顶部
            this.scrollService.removeStoredScrollInfo();
            this.gotoExternalUrl(url);
        } else {
            this.location.go(url);
            this.currentUrlSubject.next(url);
        }
    }

    /**
     * 跳转到外部路径
     *
     * @param url 路径
     */
    gotoExternalUrl(url: string): void {
        window.location.assign(url);
    }

    /**
     * 替换当前路径
     *
     * @param url 路径
     */
    replaceCurrentUrl(url: string): void {
        window.location.replace(url);
    }

    /**
     * 重新加载当前页面
     */
    reloadCurrentPage(): void {
        window.location.reload();
    }

    /**
     * 去掉路径中的特殊字符
     *
     * @param url 路径
     * @return string 去掉特殊字符后的路径
     */
    private stripSpecialChars(url: string): string {
        return url.replace(/^\/+/, '').replace(/\/+(\?|#|$)/, '$1');
    }

    /**
     * 用户下次发起导航时，需要加载整个页面
     */
    needToLoadFullPage(): void {
        this.isNeededToLoadFullPage = true;
    }

    /**
     * 获取查询参数
     *
     * @return `{ [key: string]: string | undefined }` 查询参数映射，key：查询参数名；value：查询参数值或undefined
     */
    getSearchParams(): { [key: string]: string | undefined } {
        const paramMap: { [key: string]: string | undefined } = {};
        const path = this.location.path();
        const startIndex = path.indexOf('?');
        if (startIndex > -1) {
            try {
                const params = path.slice(startIndex + 1).split('&');
                params.forEach(param => {
                    const paramPair = param.split('=');
                    if (paramPair[0]) {
                        paramMap[decodeURIComponent(paramPair[0])] = paramPair[1] && decodeURIComponent(paramPair[1]);
                    }
                });
            } catch (error) {
                // 忽略错误
            }
        }
        return paramMap;
    }

    /**
     * 设置查询参数
     *
     * @param title 标题
     * @param paramMap 查询参数映射，key：查询参数名；value：查询参数值或undefined
     */
    setSearchParams(title: string, paramMap: { [key: string]: string | undefined }): void {
        const searchParam = Object.keys(paramMap).reduce((params, paramName) => {
            const paramValue = paramMap[paramName];
            return (paramValue === undefined) ? params : params += (params ? '&' : '?') + `${encodeURIComponent(paramName)}=${encodeURIComponent(paramValue)}`;
        }, '');
        this.platformLocation.replaceState({}, title, this.platformLocation.pathname + searchParam);
    }

}
