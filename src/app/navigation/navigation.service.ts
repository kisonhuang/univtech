import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {combineLatest, ConnectableObservable, Observable} from 'rxjs';
import {map, publishLast, publishReplay} from 'rxjs/operators';

import {LocationService} from '../base/location.service';
import {UrlPrefixContent} from '../document/document.service';

import {NavigationNode, NavigationResponse, NavigationViews, CurrentNode, CurrentNodes} from './navigation.model';

export const navigationPath = UrlPrefixContent + 'navigation.json';

@Injectable()
export class NavigationService {

    navigationViews: Observable<NavigationViews>;

    currentNodes: Observable<CurrentNodes>;

    constructor(private http: HttpClient, private location: LocationService) {
        const navigationInfo = this.fetchNavigationInfo();
        this.navigationViews = this.getNavigationViews(navigationInfo);
        this.currentNodes = this.getCurrentNodes(this.navigationViews);
    }

    private fetchNavigationInfo(): Observable<NavigationResponse> {
        const navigationInfo = this.http.get<NavigationResponse>(navigationPath).pipe(publishLast());
        (navigationInfo as ConnectableObservable<NavigationResponse>).connect();
        return navigationInfo;
    }

    private getNavigationViews(navigationInfo: Observable<NavigationResponse>): Observable<NavigationViews> {
        const navigationViews = navigationInfo.pipe(
            map(response => {
                const views = Object.assign({}, response);
                Object.keys(views).forEach(key => {
                    if (key[0] === '_') {
                        delete views[key];
                    }
                });
                return views as NavigationViews;
            }),
            publishLast(),
        );
        (navigationViews as ConnectableObservable<NavigationViews>).connect();
        return navigationViews;
    }

    private getCurrentNodes(navigationViews: Observable<NavigationViews>): Observable<CurrentNodes> {
        const currentNodes = combineLatest([
            navigationViews.pipe(map(views => this.computeUrlToNavNodesMap(views))),
            this.location.currentPath,
        ]).pipe(
            map((result) => ({navMap: result[0], url: result[1]})),
            map((result) => {
                const matchSpecialUrls = /^api/.exec(result.url);
                if (matchSpecialUrls) {
                    result.url = matchSpecialUrls[0];
                }
                return result.navMap.get(result.url) || {'': {view: '', url: result.url, nodes: []}};
            }),
            publishReplay(1));
        (currentNodes as ConnectableObservable<CurrentNodes>).connect();
        return currentNodes;
    }

    private computeUrlToNavNodesMap(navigation: NavigationViews) {
        const navMap = new Map<string, CurrentNodes>();
        Object.keys(navigation).forEach(view => navigation[view].forEach(node => this.walkNodes(view, navMap, node)));
        return navMap;
    }

    private ensureHasTooltip(node: NavigationNode) {
        const title = node.title;
        const tooltip = node.tooltip;
        if (tooltip == null && title) {
            node.tooltip = title + (/[a-zA-Z0-9]$/.test(title) ? '.' : '');
        }
    }

    private walkNodes(
        view: string, navMap: Map<string, CurrentNodes>,
        node: NavigationNode, ancestors: NavigationNode[] = []) {
        const nodes = [node, ...ancestors];
        const url = node.url;
        this.ensureHasTooltip(node);

        if (url) {
            const cleanedUrl = url.replace(/\/$/, '');
            if (!navMap.has(cleanedUrl)) {
                navMap.set(cleanedUrl, {});
            }
            const navMapItem = navMap.get(cleanedUrl) as CurrentNodes;
            navMapItem[view] = {url, view, nodes};
        }

        if (node.children) {
            node.children.forEach(child => this.walkNodes(view, navMap, child, nodes));
        }
    }

}
