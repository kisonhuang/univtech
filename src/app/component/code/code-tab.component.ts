/* eslint-disable  @angular-eslint/component-selector */
import {AfterViewInit, Component, ElementRef, Input, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';

import {convertInnerHTML} from '../../base/security.service';
import {CodeComponent} from './code.component';

export interface TabInfo {
    class: string;
    code: TrustedHTML;
    path: string;
    region: string;

    header?: string;
    language?: string;
    linenum?: string;
}

/**
 * Renders a set of tab group of code snippets.
 *
 * The innerHTML of the `<code-tabs>` component should contain `<code-pane>` elements.
 * Each `<code-pane>` has the same interface as the embedded `<code-example>` component.
 * The optional `linenum` attribute is the default `linenum` for each code pane.
 */
@Component({
    selector: 'code-tabs',
    templateUrl: './code-tab.component.html',
})
export class CodeTabComponent implements OnInit, AfterViewInit {
    tabs: TabInfo[];

    @Input() linenum: string | undefined;

    @ViewChild('content', {static: true}) content: ElementRef<HTMLDivElement>;

    @ViewChildren(CodeComponent) codeComponents: QueryList<CodeComponent>;

    ngOnInit() {
        this.tabs = [];
        const contentElem = this.content.nativeElement;
        const codeExamples = Array.from(contentElem.querySelectorAll('code-pane'));

        // Remove DOM nodes that are no longer needed.
        contentElem.textContent = '';

        for (const tabContent of codeExamples) {
            this.tabs.push(this.getTabInfo(tabContent));
        }
    }

    ngAfterViewInit() {
        this.codeComponents.toArray().forEach((codeComponent, i) => {
            codeComponent.codeHtml = this.tabs[i].code;
        });
    }

    /** Gets the extracted TabInfo data from the provided code-pane element. */
    private getTabInfo(tabContent: Element): TabInfo {
        return {
            class: tabContent.getAttribute('class') || '',
            code: convertInnerHTML(tabContent),
            path: tabContent.getAttribute('path') || '',
            region: tabContent.getAttribute('region') || '',

            header: tabContent.getAttribute('header') || undefined,
            language: tabContent.getAttribute('language') || undefined,
            linenum: tabContent.getAttribute('linenum') || this.linenum,
        };
    }

}
