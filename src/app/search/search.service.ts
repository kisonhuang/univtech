import {Injectable, NgZone} from '@angular/core';

import {ConnectableObservable, Observable, race, ReplaySubject, timer} from 'rxjs';
import {concatMap, first, publishReplay} from 'rxjs/operators';

import {WebWorkerClient} from '../base/worker.service';
import {SearchResults} from './search.model';

/**
 * 搜索服务
 */
@Injectable()
export class SearchService {

    // 初始化完成的可观察对象
    private initialized: Observable<boolean>;

    // 搜索主题
    private searchSubject = new ReplaySubject<string>(1);

    // WebWorker客户端
    private webWorkerClient: WebWorkerClient;

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
                this.webWorkerClient = WebWorkerClient.create(worker, this.ngZone);
                return this.webWorkerClient.sendMessage<boolean>('load-index');
            }),
            publishReplay(1),
        );

        (initialized as ConnectableObservable<boolean>).connect();
        return initialized;
    }

    /**
     * 搜索索引
     *
     * @param queryText 查询文本
     * @return Observable<SearchResults> 搜索结果的可观察对象
     */
    searchIndex(queryText: string): Observable<SearchResults> {
        this.searchSubject.next(queryText);
        return this.initialized.pipe(concatMap(() => this.webWorkerClient.sendMessage<SearchResults>('query-index', queryText)));
    }

}
