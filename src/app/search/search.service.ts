import {Injectable, NgZone} from '@angular/core';

import {ConnectableObservable, Observable, race, ReplaySubject, timer} from 'rxjs';
import {concatMap, first, publishReplay} from 'rxjs/operators';

import {WebWorkerService} from '../base/web-worker.service';
import {SearchResults} from './search.model';

/**
 * 搜索服务
 */
@Injectable()
export class SearchService {

    // 初始化完成主题
    private initialized: Observable<boolean>;

    // 搜索主题
    private searchSubject = new ReplaySubject<string>(1);

    // WebWorker客户端
    private webWorkerService: WebWorkerService;

    /**
     * 构造函数，创建搜索服务
     *
     * @param ngZone 在Angular区域内外执行任务的服务
     */
    constructor(private ngZone: NgZone) {

    }

    /**
     * 初始化WebWorker
     *
     * @param initDelay 初始化延时（毫秒）
     */
    initWebWorker(initDelay: number) {
        const initialized = this.initialized = race<any>(
            timer(initDelay),
            this.searchSubject.asObservable().pipe(first()),
        ).pipe(
            concatMap(() => {
                const worker = new Worker(new URL('./search.worker', import.meta.url), {type: 'module'});
                this.webWorkerService = WebWorkerService.create(worker, this.ngZone);
                return this.webWorkerService.sendMessage<boolean>('load-index');
            }),
            publishReplay(1),
        );

        (initialized as ConnectableObservable<boolean>).connect();
        return initialized;
    }

    /**
     * 搜索索引
     *
     * @param queryText 搜索文本
     * @return Observable<SearchResults> 搜索结果主题
     */
    searchIndex(queryText: string): Observable<SearchResults> {
        this.searchSubject.next(queryText);
        return this.initialized.pipe(concatMap(() => this.webWorkerService.sendMessage<SearchResults>('query-index', queryText)));
    }

}
