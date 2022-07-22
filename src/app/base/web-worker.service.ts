import {NgZone} from '@angular/core';

import {Observable} from 'rxjs';

import {WebWorkerMessage} from './web-worker.model';

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
                const {type: responseType, id: responseId, payload: responsePayload} = response.data as WebWorkerMessage;
                if (type === responseType && id === responseId) {
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

            this.worker.postMessage({type, id, payload});

            return () => {
                this.worker.removeEventListener('message', handleMessage);
                this.worker.removeEventListener('error', handleError);
            };
        });
    }

}
