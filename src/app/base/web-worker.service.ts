import {NgZone} from '@angular/core';
import {Observable} from 'rxjs';

/**
 * WebWorker消息
 */
export interface WebWorkerMessage {

    // 消息id
    id?: number;

    // 消息类型
    type: string;

    // 有效负载
    payload: any;

}

/**
 * WebWorker客户端
 */
export class WebWorkerClient {

    // 下一个WebWorker消息id
    private nextId = 0;

    /**
     * 创建WebWorker客户端
     *
     * @param worker 通过脚本创建，可向其创建者发送消息的后台任务
     * @param ngZone 在Angular区域内部或外部执行任务的服务
     */
    static create(worker: Worker, ngZone: NgZone) {
        return new WebWorkerClient(worker, ngZone);
    }

    /**
     * 私有构造函数，创建WebWorker客户端
     *
     * @param worker 通过脚本创建，可向其创建者发送消息的后台任务
     * @param ngZone 在Angular区域内部或外部执行任务的服务
     */
    private constructor(private worker: Worker, private ngZone: NgZone) {

    }

    /**
     * 发送消息
     *
     * @param type 消息类型
     * @param payload 有效负载
     */
    sendMessage<T>(type: string, payload?: any): Observable<T> {
        return new Observable<T>(subscriber => {
            const id = this.nextId++;

            // 消息事件处理器
            const handleMessage = (response: MessageEvent) => {
                const {
                    id: responseId,
                    type: responseType,
                    payload: responsePayload
                } = response.data as WebWorkerMessage;

                if (id === responseId && type === responseType) {
                    this.ngZone.run(() => {
                        subscriber.next(responsePayload);
                        subscriber.complete();
                    });
                }
            };

            // 错误事件处理器
            const handleError = (error: ErrorEvent) => {
                // 因为不检查id和类型，来自WebWorker的任何错误都会关闭所有订阅者
                this.ngZone.run(() => subscriber.error(error));
            };

            // 添加事件监听器
            this.worker.addEventListener('message', handleMessage);
            this.worker.addEventListener('error', handleError);

            // 把消息发送到WebWorker
            this.worker.postMessage({id, type, payload});

            return () => {
                // 完成或错误时，移除事件监听器
                this.worker.removeEventListener('message', handleMessage);
                this.worker.removeEventListener('error', handleError);
            };
        });
    }

}

