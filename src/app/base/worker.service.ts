import {NgZone} from '@angular/core';

import {Observable} from 'rxjs';

export interface WebWorkerMessage {
    id?: number;
    type: string;
    payload: any;
}

export class WebWorkerClient {

    private nextId = 0;

    static create(worker: Worker, ngZone: NgZone) {
        return new WebWorkerClient(worker, ngZone);
    }

    private constructor(private worker: Worker, private ngZone: NgZone) {

    }

    sendMessage<T>(type: string, payload?: any): Observable<T> {
        return new Observable<T>(subscriber => {
            const id = this.nextId++;

            const handleMessage = (response: MessageEvent) => {
                const {id: responseId, type: responseType, payload: responsePayload} = response.data as WebWorkerMessage;
                if (id === responseId && type === responseType) {
                    this.ngZone.run(() => {
                        subscriber.next(responsePayload);
                        subscriber.complete();
                    });
                }
            };

            const handleError = (error: ErrorEvent) => {
                this.ngZone.run(() => subscriber.error(error));
            };

            this.worker.addEventListener('message', handleMessage);
            this.worker.addEventListener('error', handleError);
            this.worker.postMessage({id, type, payload});

            return () => {
                this.worker.removeEventListener('message', handleMessage);
                this.worker.removeEventListener('error', handleError);
            };
        });
    }

}

