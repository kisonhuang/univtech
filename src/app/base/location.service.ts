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

    handleAnchorClick(anchorElement: HTMLAnchorElement, mouseButton = 0, ctrlKey = false, metaKey = false) {
        if (mouseButton !== 0 || ctrlKey || metaKey) {
            return true;
        }

        const anchorTarget = anchorElement.target;
        if (anchorTarget && anchorTarget !== '_self') {
            return true;
        }

        if (anchorElement.getAttribute('download') != null) {
            return true;
        }

        const {pathname, search, hash} = anchorElement;
        const isInPageAnchor = anchorElement.getAttribute('href')?.startsWith('#') ?? false;
        const currentPathname = isInPageAnchor ? this.location.path() : pathname;
        const relativeUrl = currentPathname + search + hash;
        this.urlParser.href = relativeUrl;

        if ((!isInPageAnchor && anchorElement.href !== this.urlParser.href) || !/\/[^/.]*$/.test(pathname)) {
            return true;
        }

        this.gotoUrl(relativeUrl);
        return false;
    }

}
