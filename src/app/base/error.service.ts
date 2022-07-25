import {Inject, Injectable, ErrorHandler, VERSION} from '@angular/core';

import {windowToken} from './window.service';

/**
 * 错误服务，扩展默认的错误处理器，向谷歌分析服务报告错误。
 * Angular应用程序之外的错误也可以通过window.onerror来处理。
 */
@Injectable()
export class ErrorService extends ErrorHandler {

    /**
     * 构造函数，创建错误服务
     *
     * @param window Window对象
     */
    constructor(@Inject(windowToken) private window: Window) {
        super();
    }

    /**
     * 处理错误，把错误信息发送到谷歌分析服务
     *
     * @param error 错误对象
     */
    override handleError(error: any): void {
        const versionedError = this.addVersionPrefix(error);
        try {
            super.handleError(versionedError);
        } catch (e) {
            this.reportError(e);
        }
        this.reportError(versionedError);
    }

    /**
     * 在错误信息前面添加版本信息
     *
     * @param error 错误对象
     * @return T 错误对象
     */
    private addVersionPrefix<T>(error: T): T {
        const versionPrefix = `[v${VERSION.full}] `;
        if (error instanceof Error) {
            const oldMessage = error.message;
            const newMessage = versionPrefix + oldMessage;
            error.message = newMessage;
            error.stack = error.stack?.replace(oldMessage, newMessage);
        } else if (typeof error === 'string') {
            error = versionPrefix + error as unknown as T;
        }
        return error;
    }

    /**
     * 报告错误
     *
     * @param error 错误对象
     */
    private reportError(error: unknown): void {
        if (this.window.onerror) {
            if (error instanceof Error) {
                this.window.onerror(error.message, undefined, undefined, undefined, error);
            } else {
                if (typeof error === 'object') {
                    try {
                        error = JSON.stringify(error);
                    } catch {
                        // 忽略错误
                    }
                }
                this.window.onerror(`${error}`);
            }
        }
    }

}
