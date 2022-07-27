import {Component, ElementRef, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import {Meta, Title} from '@angular/platform-browser';

import {asapScheduler, Observable, of, timer} from 'rxjs';
import {catchError, observeOn, switchMap, takeUntil, tap} from 'rxjs/operators';

import {EMPTY_HTML, unwrapHtmlForSink} from 'safevalues';

import {LogService} from '../base/log.service';
import {convertInnerHTML} from '../base/security.service';
import {TocService} from '../base/toc.service';
import {ElementLoadService} from '../element/element-load.service';
import {DocSafe} from './doc.model';
import {docNotFoundId, docErrorId} from './doc.service';

export const noAnimation = 'no-animations';

const initialDocViewElement = document.querySelector('univ-doc-view');

const initialDocViewContent = initialDocViewElement ? convertInnerHTML(initialDocViewElement) : EMPTY_HTML;

@Component({
    selector: 'univ-doc-view',
    template: ''
})
export class DocViewComponent implements OnDestroy {

    private hostElement: HTMLElement;

    private voidObservable = of<void>(undefined);

    private destroyEmitter = new EventEmitter<void>();

    private docContentEmitter = new EventEmitter<DocSafe>();

    protected currentDocViewDivElement: HTMLElement = document.createElement('div');

    protected nextDocViewDivElement: HTMLElement = document.createElement('div');

    @Input() set doc(newDoc: DocSafe) {
        // Ignore `undefined` values that could happen if the host component
        // does not initially specify a value for the `doc` input.
        if (newDoc) {
            this.docContentEmitter.emit(newDoc);
        }
    }

    // The new document is ready to be inserted into the viewer.
    // (Embedded components have been loaded and instantiated, if necessary.)
    @Output() docReady = new EventEmitter<void>();

    // The previous document has been removed from the viewer.
    // (The leaving animation (if any) has been completed and the node has been removed from the DOM.)
    @Output() docRemoved = new EventEmitter<void>();

    // The new document has been inserted into the viewer.
    // (The node has been inserted into the DOM, but the entering animation may still be in progress.)
    @Output() docInserted = new EventEmitter<void>();

    // The new document has been fully rendered into the viewer.
    // (The entering animation has been completed.)
    @Output() docRendered = new EventEmitter<void>();

    constructor(
        elementRef: ElementRef, private logService: LogService, private titleService: Title,
        private metaService: Meta, private tocService: TocService,
        private elementLoadService: ElementLoadService) {
        this.hostElement = elementRef.nativeElement;

        // Security: the initialDocViewerContent comes from the prerendered DOM and is considered to be
        // secure
        this.hostElement.innerHTML = unwrapHtmlForSink(initialDocViewContent);

        if (this.hostElement.firstElementChild) {
            this.currentDocViewDivElement = this.hostElement.firstElementChild as HTMLElement;
        }

        this.docContentEmitter
            .pipe(
                observeOn(asapScheduler),
                switchMap(newDoc => this.render(newDoc)),
                takeUntil(this.destroyEmitter),
            )
            .subscribe();
    }

    ngOnDestroy() {
        this.destroyEmitter.emit();
    }

    /**
     * Prepare for setting the window title and ToC.
     * Return a function to actually set them.
     */
    protected prepareTitleAndToc(targetElem: HTMLElement, docId: string): () => void {
        const titleEl = targetElem.querySelector('h1');
        const needsTitle = !!titleEl && !/no-?title/i.test(titleEl.className);
        const needsToc = !!titleEl && !/no-?toc/i.test(titleEl.className);
        const embeddedToc = targetElem.querySelector('aio-toc.embedded');

        if (titleEl && titleEl.parentNode && needsToc && !embeddedToc) {
            // Add an embedded ToC if it's needed and there isn't one in the content already.
            const toc = document.createElement('aio-toc');
            toc.className = 'embedded';
            titleEl.parentNode.insertBefore(toc, titleEl.nextSibling);
        } else if (!needsToc && embeddedToc) {
            // Remove the embedded Toc if it's there and not needed.
            embeddedToc.remove();
        }

        return () => {
            this.tocService.resetTocItems();
            let title: string | null = '';

            // Only create ToC for docs with an `<h1>` heading.
            // If you don't want a ToC, add "no-toc" class to `<h1>`.
            if (titleEl) {
                if (needsTitle) {
                    title = (typeof titleEl.innerText === 'string') ? titleEl.innerText : titleEl.textContent;
                }

                if (needsToc) {
                    this.tocService.generateTocItems(targetElem, docId);
                }
            }

            this.titleService.setTitle(title ? `Angular - ${title}` : 'Angular');
        };
    }

    /**
     * Add doc content to host element and build it out with embedded components.
     */
    protected render(doc: DocSafe): Observable<void> {
        let addTitleAndToc: () => void;

        this.setNoIndex(doc.id === docNotFoundId || doc.id === docErrorId);

        return this.voidObservable.pipe(
            tap(() => {
                if (doc.content === null) {
                    this.nextDocViewDivElement.textContent = '';
                } else {
                    // Security: `doc.contents` is always authored by the documentation team
                    //           and is considered to be safe.
                    this.nextDocViewDivElement.innerHTML = unwrapHtmlForSink(doc.content);
                }
            }),
            tap(() => addTitleAndToc = this.prepareTitleAndToc(this.nextDocViewDivElement, doc.id)),
            switchMap(() => this.elementLoadService.loadElementComponentModules(this.nextDocViewDivElement)),
            tap(() => this.docReady.emit()),
            switchMap(() => this.swapViews(addTitleAndToc)),
            tap(() => this.docRendered.emit()),
            catchError(err => {
                const errorMessage = `${(err instanceof Error) ? err.stack : err}`;
                this.logService.error(
                    new Error(`[DocViewer] Error preparing document '${doc.id}': ${errorMessage}`));
                this.nextDocViewDivElement.textContent = '';
                this.setNoIndex(true);

                // TODO(gkalpak): Remove this once gathering debug info is no longer needed.
                if (/loading chunk \S+ failed/i.test(errorMessage)) {
                    // Print some info to help with debugging.
                    // (There is no reason to wait for this async call to complete before continuing.)
                    printSwDebugInfo();
                }

                return this.voidObservable;
            }),
        );
    }

    /**
     * Tell search engine crawlers whether to index this page
     */
    private setNoIndex(val: boolean) {
        if (val) {
            this.metaService.addTag({name: 'robots', content: 'noindex'});
        } else {
            this.metaService.removeTag('name="robots"');
        }
    }

    /**
     * Swap the views, removing `currentDocViewDivElement` and inserting `nextDocViewDivElement`.
     * (At this point all content should be ready, including having loaded and instantiated embedded
     *  components.)
     *
     * Optionally, run a callback as soon as `nextDocViewDivElement` has been inserted, but before the
     * entering animation has been completed. This is useful for work that needs to be done as soon as
     * the element has been attached to the DOM.
     */
    protected swapViews(onInsertedCb = () => {
    }): Observable<void> {
        const raf$ = new Observable<void>(subscriber => {
            const rafId = requestAnimationFrame(() => {
                subscriber.next();
                subscriber.complete();
            });
            return () => cancelAnimationFrame(rafId);
        });

        // Get the actual transition duration (taking global styles into account).
        // According to the [CSSOM spec](https://drafts.csswg.org/cssom/#serializing-css-values),
        // `time` values should be returned in seconds.
        const getActualDuration = (elem: HTMLElement) => {
            const cssValue = getComputedStyle(elem).transitionDuration || '';
            const seconds = Number(cssValue.replace(/s$/, ''));
            return 1000 * seconds;
        };

        // Some properties are not assignable and thus cannot be animated.
        // Example methods, readonly and CSS properties:
        // "length", "parentRule", "getPropertyPriority", "getPropertyValue", "item", "removeProperty",
        // "setProperty"
        type StringValueCSSStyleDeclaration = Exclude<{
            [K in keyof CSSStyleDeclaration]:
            CSSStyleDeclaration[K] extends string ? K : never;
        }[keyof CSSStyleDeclaration],
            number>;
        const animateProp =
            (elem: HTMLElement, prop: StringValueCSSStyleDeclaration, from: string, to: string,
             duration = 200) => {
                const animationsDisabled = this.hostElement.classList.contains(noAnimation);
                elem.style.transition = '';
                return animationsDisabled ?
                    this.voidObservable.pipe(tap(() => elem.style[prop] = to)) :
                    this.voidObservable.pipe(
                        // In order to ensure that the `from` value will be applied immediately (i.e.
                        // without transition) and that the `to` value will be affected by the
                        // `transition` style, we need to ensure an animation frame has passed between
                        // setting each style.
                        switchMap(() => raf$),
                        tap(() => elem.style[prop] = from),
                        switchMap(() => raf$),
                        tap(() => elem.style.transition = `all ${duration}ms ease-in-out`),
                        switchMap(() => raf$),
                        tap(() => elem.style[prop] = to),
                        switchMap(() => timer(getActualDuration(elem))),
                        switchMap(() => this.voidObservable),
                    );
            };

        const animateLeave = (elem: HTMLElement) => animateProp(elem, 'opacity', '1', '0.1');
        const animateEnter = (elem: HTMLElement) => animateProp(elem, 'opacity', '0.1', '1');

        let done$ = this.voidObservable;

        if (this.currentDocViewDivElement.parentElement) {
            done$ = done$.pipe(
                // Remove the current view from the viewer.
                switchMap(() => animateLeave(this.currentDocViewDivElement)),
                tap(() => (this.currentDocViewDivElement.parentElement as HTMLElement)
                    .removeChild(this.currentDocViewDivElement)),
                tap(() => this.docRemoved.emit()),
            );
        }

        return done$.pipe(
            // Insert the next view into the viewer.
            tap(() => this.hostElement.appendChild(this.nextDocViewDivElement)),
            tap(() => onInsertedCb()),
            tap(() => this.docInserted.emit()),
            switchMap(() => animateEnter(this.nextDocViewDivElement)),
            // Update the view references and clean up unused nodes.
            tap(() => {
                const prevViewContainer = this.currentDocViewDivElement;
                this.currentDocViewDivElement = this.nextDocViewDivElement;
                this.nextDocViewDivElement = prevViewContainer;
                this.nextDocViewDivElement.textContent = '';  // Empty to release memory.
            }),
        );
    }
}

// Helpers
/**
 * Print some info regarding the ServiceWorker and the caches contents to help debugging potential
 * issues with failing to find resources in the cache.
 * (See https://github.com/angular/angular/issues/28114.)
 */
async function printSwDebugInfo(): Promise<void> {
    const sep = '\n----------';
    const swState = navigator.serviceWorker?.controller?.state ?? 'N/A';

    console.log(`\nServiceWorker: ${swState}`);

    if (typeof caches === 'undefined') {
        console.log(`${sep}\nCaches: N/A`);
    } else {
        const allCacheNames = await caches.keys();
        const swCacheNames = allCacheNames.filter(name => name.startsWith('ngsw:/:'));

        await findCachesAndPrintEntries(swCacheNames, 'db:control', true, ['manifests']);
        await findCachesAndPrintEntries(swCacheNames, 'assets:app-shell:cache', false);
        await findCachesAndPrintEntries(swCacheNames, 'assets:app-shell:meta', true);
    }

    if (swState === 'activated') {
        console.log(sep);
        await fetchAndPrintSwInternalDebugInfo();
    }

    console.warn(
        `${sep}\nIf you see this error, please report an issue at ` +
        'https://github.com/angular/angular/issues/new?template=3-docs-bug.md including the above logs.');

    // Internal helpers
    async function fetchAndPrintSwInternalDebugInfo() {
        try {
            const res = await fetch('/ngsw/state');
            if (!res.ok) {
                throw new Error(`Response ${res.status} ${res.statusText}`);
            }
            console.log(await res.text());
        } catch (err) {
            console.log(
                `Failed to retrieve debug info from '/ngsw/state': ${(err as Error).message || err}`);
        }
    }

    async function findCachesAndPrintEntries(
        swCacheNames: string[], nameSuffix: string, includeValues: boolean,
        ignoredKeys: string[] = []): Promise<void> {
        const cacheNames = swCacheNames.filter(name => name.endsWith(nameSuffix));

        for (const cacheName of cacheNames) {
            const cacheEntries = await getCacheEntries(cacheName, includeValues, ignoredKeys);
            await printCacheEntries(cacheName, cacheEntries);
        }
    }

    async function getCacheEntries(name: string, includeValues: boolean, ignoredKeys: string[] = []):
        Promise<{ key: string, value?: unknown }[]> {
        const ignoredUrls = new Set(ignoredKeys.map(key => new Request(key).url));

        const cache = await caches.open(name);
        const keys = (await cache.keys()).map(req => req.url).filter(url => !ignoredUrls.has(url));
        const entries = await Promise.all(
            keys.map(async key => ({
                key,
                value: !includeValues ? undefined : await (await cache.match(key))?.json(),
            })));

        return entries;
    }

    function printCacheEntries(name: string, entries: { key: string, value?: unknown }[]): void {
        const entriesStr =
            entries.map(({key, value}) => `  - ${key}${!value ? '' : `: ${JSON.stringify(value)}`}`)
                .join('\n');

        console.log(`\nCache: ${name} (${entries.length} entries)\n${entriesStr}`);
    }
}
