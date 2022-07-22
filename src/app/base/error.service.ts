import {ErrorHandler, Inject, Injectable, VERSION} from '@angular/core';

import {windowToken} from './window.service';

@Injectable()
export class ErrorService extends ErrorHandler {

    constructor(@Inject(windowToken) private window: Window) {
        super();
    }

    override handleError(error: any) {
        const versionedError = this.addVersionPrefix(error);
        try {
            super.handleError(versionedError);
        } catch (e) {
            this.reportError(e);
        }
        this.reportError(versionedError);
    }

    private addVersionPrefix<T>(error: T): T {
        const prefix = `[v${VERSION.full}] `;
        if (error instanceof Error) {
            const oldMessage = error.message;
            const newMessage = prefix + oldMessage;
            error.message = newMessage;
            error.stack = error.stack?.replace(oldMessage, newMessage);
        } else if (typeof error === 'string') {
            error = prefix + error as unknown as T;
        }
        return error;
    }

    private reportError(error: unknown) {
        if (this.window.onerror) {
            if (error instanceof Error) {
                this.window.onerror(error.message, undefined, undefined, undefined, error);
            } else {
                if (typeof error === 'object') {
                    try {
                        error = JSON.stringify(error);
                    } catch {

                    }
                }
                this.window.onerror(`${error}`);
            }
        }
    }

}
