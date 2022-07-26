import {Injectable, OnDestroy, ApplicationRef, ErrorHandler} from '@angular/core';
import {SwUpdate} from '@angular/service-worker';

import {Subject, concat, interval} from 'rxjs';
import {first, tap, takeUntil} from 'rxjs/operators';

import {LogService} from './log.service';
import {LocationService} from './location.service';

/**
 * ServiceWorker服务
 */
@Injectable({providedIn: 'root'})
export class ServiceWorkerService implements OnDestroy {

    // 检查的时间间隔：6小时
    private checkInterval = 6 * 60 * 60 * 1000;

    // 禁用ServiceWorker更新主题
    private disableSubject = new Subject<void>();

    /**
     * 构造函数，创建ServiceWorker服务
     *
     * @param applicationRef 应用程序引用
     * @param errorHandler 错误处理器
     * @param swUpdate ServiceWorker更新器
     * @param logService 日志服务
     * @param locationService 地址服务
     */
    constructor(private applicationRef: ApplicationRef,
                private errorHandler: ErrorHandler,
                private swUpdate: SwUpdate,
                private logService: LogService,
                private locationService: LocationService) {

    }

    /**
     * 销毁之前的清理回调方法
     */
    ngOnDestroy(): void {
        this.disableUpdate();
    }

    /**
     * 启用ServiceWorker更新
     */
    enableUpdate(): void {
        if (!this.swUpdate.isEnabled) {
            return;
        }

        // 应用程序稳定后，定期检查更新
        const isAppStable = this.applicationRef.isStable.pipe(first(isStable => isStable));
        concat(isAppStable, interval(this.checkInterval))
            .pipe(
                tap(() => this.logMessage('正在检查更新...')),
                takeUntil(this.disableSubject),
            )
            .subscribe(() => this.swUpdate.checkForUpdate());

        // 应用程序新版本已经可用，把当前客户端更新为最新版本
        this.swUpdate.available
            .pipe(
                tap(event => this.logMessage(`应用程序新版本已经可用：${JSON.stringify(event)}`)),
                takeUntil(this.disableSubject),
            )
            .subscribe(() => this.swUpdate.activateUpdate());

        // 应用程序已更新为新版本，需要加载整个页面
        this.swUpdate.activated
            .pipe(
                tap(event => this.logMessage(`应用程序已更新为新版本：${JSON.stringify(event)}`)),
                takeUntil(this.disableSubject),
            )
            .subscribe(() => this.locationService.needToLoadFullPage());

        // 应用程序崩溃且无法恢复，重新加载当前页面
        this.swUpdate.unrecoverable
            .pipe(
                tap(event => {
                    this.logMessage(`应用程序崩溃且无法恢复：${JSON.stringify(event)}`);
                    this.errorHandler.handleError(`应用程序崩溃且无法恢复：${event.reason}`);
                }),
                takeUntil(this.disableSubject),
            )
            .subscribe(() => this.locationService.reloadCurrentPage());
    }

    /**
     * 禁用ServiceWorker更新
     */
    disableUpdate(): void {
        this.disableSubject.next();
    }

    /**
     * 记录日志信息
     *
     * @param message 日志信息
     */
    private logMessage(message: string): void {
        const timestamp = new Date().toISOString();
        this.logService.log(`[SwUpdate - ${timestamp}]: ${message}`);
    }

}
