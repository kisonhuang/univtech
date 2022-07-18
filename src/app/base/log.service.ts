import {ErrorHandler, Injectable} from '@angular/core';

import {environment} from '../../environments/environment';

/**
 * 日志记录器服务
 */
@Injectable()
export class LogService {

    /**
     * 构造函数，创建日志记录器
     *
     * @param errorHandler 错误处理器
     */
    constructor(private errorHandler: ErrorHandler) {

    }

    /**
     * 非生产环境中，在控制台输出普通日志
     *
     * @param message 消息模板
     * @param params 消息参数
     */
    log(message: any, ...params: any[]) {
        if (!environment.production) {
            console.log(message, ...params);
        }
    }

    /**
     * 在控制台输出警告日志
     *
     * @param message 消息模板
     * @param params 消息参数
     */
    warn(message: any, ...params: any[]) {
        console.warn(message, ...params);
    }

    /**
     * 使用错误处理器处理错误
     *
     * @param error 错误
     */
    error(error: Error) {
        this.errorHandler.handleError(error);
    }

}
