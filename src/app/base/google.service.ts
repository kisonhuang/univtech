import {Inject, Injectable} from '@angular/core';

import {WindowToken} from './window.service';
import {environment} from '../../environments/environment';

@Injectable()
export class GoogleService {

    private previousUrl?: string;

    constructor(@Inject(WindowToken) private window: Window) {
        this.callGaFunc('create', environment.gaId, 'auto');
    }

    changeLocation(url: string) {
        this.sendPageview(url);
    }

    sendPageview(url: string) {
        if (url === this.previousUrl) {
            return;
        }
        this.previousUrl = url;
        this.callGaFunc('set', 'page', '/' + url);
        this.callGaFunc('send', 'pageview');
    }

    sendEvent(source: string, action: string, label?: string, value?: number) {
        this.callGaFunc('send', 'event', source, action, label, value);
    }

    callGaFunc(...args: any[]) {
        const gaFunc = (this.window as any).callGaFunc;
        if (gaFunc) {
            gaFunc(...args);
        }
    }

}
