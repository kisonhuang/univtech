import {NgZone} from '@angular/core';

import {Observable} from 'rxjs';

// WebWorker消息
export interface WebWorkerMessage {
    // 消息类型
    type: string;
    // 消息id
    id?: number;
    // 有效负载
    payload: any;
}

/**
 * WebWorker服务
 */
export class WebWorkerService {

    // 下一个消息id
    private nextId: number = 0;

    /**
     * 创建WebWorker服务
     *
     * @param worker 通过脚本创建，可以把消息发回给创建者的后台任务
     * @param ngZone 在Angular区域内外执行任务的服务
     * @return WebWorker服务
     */
    static create(worker: Worker, ngZone: NgZone): WebWorkerService {
        return new WebWorkerService(worker, ngZone);
    }

    /**
     * 私有构造函数，创建WebWorker服务
     *
     * @param worker 通过脚本创建，可以把消息发回给创建者的后台任务
     * @param ngZone 在Angular区域内外执行任务的服务
     */
    private constructor(private worker: Worker, private ngZone: NgZone) {

    }

    /**
     * 发送消息
     *
     * @param type 消息类型
     * @param payload 有效负载
     * @return 消息发送主题
     */
    sendMessage<T>(type: string, payload?: any): Observable<T> {
        return new Observable<T>(subscriber => {
            const id = this.nextId++;

            // 处理消息事件
            const handleMessage = (event: MessageEvent) => {
                const message = event.data as WebWorkerMessage;
                if (type === message.type && id === message.id) {
                    this.ngZone.run(() => {
                        subscriber.next(message.payload);
                        subscriber.complete();
                    });
                }
            };

            // 处理错误事件
            const handleError = (event: ErrorEvent) => {
                // 没有检查类型和id，来自WebWorker的任何错误都会停止所有订阅者
                this.ngZone.run(() => subscriber.error(event));
            };

            // 添加事件监听器
            this.worker.addEventListener('message', handleMessage);
            this.worker.addEventListener('error', handleError);

            // 把消息发送给WebWorker
            this.worker.postMessage({type, id, payload});

            // 发送完成或发生错误时，删除事件监听器
            return () => {
                this.worker.removeEventListener('message', handleMessage);
                this.worker.removeEventListener('error', handleError);
            };
        });
    }

}
