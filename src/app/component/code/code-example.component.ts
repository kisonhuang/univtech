/* eslint-disable  @angular-eslint/component-selector */
import {Component, HostBinding, ElementRef, ViewChild, Input, AfterViewInit} from '@angular/core';

import {convertInnerHTML} from '../../base/security.service';
import {CodeComponent} from './code.component';

/**
 * An embeddable code block that displays nicely formatted code.
 * Example usage:
 *
 * ```
 * <code-example language="ts" linenums="2" class="special" header="Do Stuff">
 * // a code block
 * console.log('do stuff');
 * </code-example>
 * ```
 */
@Component({
    selector: 'code-example',
    templateUrl: './code-example.component.html',
})
export class CodeExampleComponent implements AfterViewInit {
    classes: { 'headed-code': boolean, 'simple-code': boolean };

    @Input() language: string;

    @Input() linenums: string;

    @Input() region: string;

    @Input()
    set header(header: string) {
        this._header = header;
        this.classes = {
            'headed-code': !!this.header,
            'simple-code': !this.header,
        };
    }

    get header(): string {
        return this._header;
    }

    private _header: string;

    @Input()
    set path(path: string) {
        this._path = path;
        this.isAvoid = this.path.indexOf('.avoid.') !== -1;
    }

    get path(): string {
        return this._path;
    }

    private _path = '';

    @Input()
    set hidecopy(hidecopy: boolean) {
        // Coerce the boolean value.
        this._hidecopy = hidecopy != null && `${hidecopy}` !== 'false';
    }

    get hidecopy(): boolean {
        return this._hidecopy;
    }

    private _hidecopy: boolean;

    /* eslint-disable-next-line @angular-eslint/no-input-rename */
    @Input('hide-copy')
    set hyphenatedHideCopy(hidecopy: boolean) {
        this.hidecopy = hidecopy;
    }

    /* eslint-disable-next-line @angular-eslint/no-input-rename */
    @Input('hideCopy')
    set capitalizedHideCopy(hidecopy: boolean) {
        this.hidecopy = hidecopy;
    }

    @HostBinding('class.avoidFile') isAvoid = false;

    @ViewChild('content', {static: true}) content: ElementRef<HTMLDivElement>;

    @ViewChild(CodeComponent, {static: true}) aioCode: CodeComponent;

    ngAfterViewInit() {
        const contentElem = this.content.nativeElement;
        this.aioCode.codeHtml = convertInnerHTML(contentElem);
        contentElem.textContent = '';  // Remove DOM nodes that are no longer needed.
    }

}
