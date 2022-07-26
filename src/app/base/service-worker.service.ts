import {Injectable, OnDestroy, ApplicationRef, ErrorHandler} from '@angular/core';
import {SwUpdate} from '@angular/service-worker';

import {Subject, concat, interval} from 'rxjs';
import {first, tap, takeUntil} from 'rxjs/operators';

import {LogService} from './log.service';
import {LocationService} from './location.service';

/**
 * SwUpdatesService
 *
 * @description
 * While enabled, this service will:
 * 1. Check for available ServiceWorker updates every 6 hours.
 * 2. Activate an update as soon as one is available.
 */
@Injectable({providedIn: 'root'})
export class ServiceWorkerService implements OnDestroy {

    private checkInterval = 1000 * 60 * 60 * 6;  // 6 hours

    private onDisable = new Subject<void>();

    constructor(private applicationRef: ApplicationRef,
                private errorHandler: ErrorHandler,
                private swUpdate: SwUpdate,
                private logService: LogService,
                private locationService: LocationService) {

    }

    disable() {
        this.onDisable.next();
    }

    enable() {
        if (!this.swUpdate.isEnabled) {
            return;
        }

        // Periodically check for updates (after the app is stabilized).
        const appIsStable = this.applicationRef.isStable.pipe(first(v => v));
        concat(appIsStable, interval(this.checkInterval))
            .pipe(
                tap(() => this.log('Checking for update...')),
                takeUntil(this.onDisable),
            )
            .subscribe(() => this.swUpdate.checkForUpdate());

        // Activate available updates.
        this.swUpdate.available
            .pipe(
                tap(evt => this.log(`Update available: ${JSON.stringify(evt)}`)),
                takeUntil(this.onDisable),
            )
            .subscribe(() => this.swUpdate.activateUpdate());

        // Request a full page navigation once an update has been activated.
        this.swUpdate.activated
            .pipe(
                tap(evt => this.log(`Update activated: ${JSON.stringify(evt)}`)),
                takeUntil(this.onDisable),
            )
            .subscribe(() => this.locationService.needToLoadFullPage());

        // Request an immediate page reload once an unrecoverable state has been detected.
        this.swUpdate.unrecoverable
            .pipe(
                tap(evt => {
                    const errorMsg = `Unrecoverable state: ${evt.reason}`;
                    this.errorHandler.handleError(errorMsg);
                    this.log(`${errorMsg}\nReloading...`);
                }),
                takeUntil(this.onDisable),
            )
            .subscribe(() => this.locationService.reloadCurrentPage());
    }

    ngOnDestroy() {
        this.disable();
    }

    private log(message: string) {
        const timestamp = new Date().toISOString();
        this.logService.log(`[SwUpdates - ${timestamp}]: ${message}`);
    }

}
