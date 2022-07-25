import {Injectable} from '@angular/core';
import {Location, PlatformLocation} from '@angular/common';

import {ReplaySubject} from 'rxjs';
import {map, tap} from 'rxjs/operators';

import {GoogleService} from './google.service';
import {ScrollService} from './scroll.service';

@Injectable()
export class LocationService {

    private readonly urlParser = document.createElement('a');

    private urlSubject = new ReplaySubject<string>(1);

    private fullPageNavigation = false;

    currentUrl = this.urlSubject.pipe(map(url => this.stripSlashes(url)));

    currentPath = this.currentUrl.pipe(map(url => (url.match(/[^?#]*/) || [])[0]), tap(path => this.googleService.changeLocation(path)));

    constructor(private platformLocation: PlatformLocation,
                private location: Location,
                private googleService: GoogleService,
                private scrollService: ScrollService) {
        this.urlSubject.next(location.path(true));
        this.location.subscribe(state => this.urlSubject.next(state.url || ''));
    }

    fullPageNavigationNeeded(): void {
        this.fullPageNavigation = true;
    }

    gotoUrl(url: string | null | undefined) {
        if (!url) {
            return;
        }
        url = this.stripSlashes(url);
        if (/^http/.test(url)) {
            this.gotoExternalUrl(url);
        } else if (this.fullPageNavigation) {
            this.scrollService.removeStoredScrollInfo();
            this.gotoExternalUrl(url);
        } else {
            this.location.go(url);
            this.urlSubject.next(url);
        }
    }

    gotoExternalUrl(url: string) {
        window.location.assign(url);
    }

    replaceUrl(url: string) {
        window.location.replace(url);
    }

    reloadPage(): void {
        window.location.reload();
    }

    private stripSlashes(url: string) {
        return url.replace(/^\/+/, '').replace(/\/+(\?|#|$)/, '$1');
    }

    getSearchParams() {
        const search: { [key: string]: string | undefined } = {};
        const path = this.location.path();
        const index = path.indexOf('?');
        if (index > -1) {
            try {
                const params = path.slice(index + 1).split('&');
                params.forEach(param => {
                    const paramPair = param.split('=');
                    if (paramPair[0]) {
                        search[decodeURIComponent(paramPair[0])] = paramPair[1] && decodeURIComponent(paramPair[1]);
                    }
                });
            } catch (e) {

            }
        }
        return search;
    }

    setSearchParams(title: string, params: { [key: string]: string | undefined }) {
        const search = Object.keys(params).reduce((result, key) => {
            const value = params[key];
            return (value === undefined) ? result : result += (result ? '&' : '?') + `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }, '');

        this.platformLocation.replaceState({}, title, this.platformLocation.pathname + search);
    }

    /**
     * 处理链接的点击事件。
     * 因为使用地址服务在文档之间进行导航，浏览器不重新加载页面，所以必须拦截链接的点击事件。
     * 如果链接指向将要显示的文档，那么使用gotoUrl进行导航，并告诉浏览器不需要处理链接的点击事件。
     * 大多数应用程序可能都会在链接上添加的LinkDirective中这么做，但是这个应用程序存在一个特殊情况，
     * DocViewerComponent显示的是不能包含指令的半静态内容，所以内容中的所有链接都不能使用LinkDirective。
     * 因此在AppComponent中添加了一个应用程序中所有元素的点击事件处理器，用于捕获DocViewerComponent内外所有链接的点击事件。
     *
     * @param anchorElement 点击的链接
     * @param mouseClicks 鼠标的点击次数，0：点击鼠标左键或没有点击鼠标
     * @param ctrlPressed 是否按下Ctrl键，true：按下了Ctrl键；false：没有按下Ctrl键
     * @param metaPressed 是否按下Alt键或窗口键，true：按下了Alt键或窗口键；false：没有按下Alt键或窗口键
     * @return boolean true：让浏览器处理链接的点击事件；false：使用gotoUrl进行导航，浏览器不需要处理链接的点击事件
     */
    handleAnchorClickEvent(anchorElement: HTMLAnchorElement, mouseClicks = 0, ctrlPressed = false, metaPressed = false): boolean {
        // 点击非鼠标左键，或者按下了Ctrl键，或者按下了Alt键或窗口键时，让浏览器处理链接的点击事件
        if (mouseClicks !== 0 || ctrlPressed || metaPressed) {
            return true;
        }

        // 链接中存在target属性，并且target属性的值不是_self时，让浏览器处理链接的点击事件
        const anchorTarget = anchorElement.target;
        if (anchorTarget && anchorTarget !== '_self') {
            return true;
        }

        // 链接中存在download属性时，让浏览器处理链接的点击事件
        if (anchorElement.getAttribute('download') != null) {
            return true;
        }

        // 修复页内链接，页内链接应该指向页内片段，相对于根路径`/`来进行解析，因为基础路径已被设置成为`/`
        // 参考：https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base#in-page_anchors
        const isInPageAnchor = anchorElement.getAttribute('href')?.startsWith('#') ?? false;
        const realPathname = isInPageAnchor ? this.location.path() : anchorElement.pathname;
        const relativeUrl = realPathname + anchorElement.search + anchorElement.hash;
        this.urlParser.href = relativeUrl;

        // 链接是外部链接，或者链接中存在扩展名时，让浏览器处理链接的点击事件
        if ((!isInPageAnchor && anchorElement.href !== this.urlParser.href) || !/\/[^/.]*$/.test(anchorElement.pathname)) {
            return true;
        }

        // 使用gotoUrl进行导航，浏览器不需要处理链接的点击事件
        this.gotoUrl(relativeUrl);
        return false;
    }

}
