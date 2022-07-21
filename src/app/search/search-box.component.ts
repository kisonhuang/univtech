/* eslint-disable @angular-eslint/no-output-on-prefix */
import {AfterViewInit, Component, ViewChild, ElementRef, EventEmitter, Output} from '@angular/core';

import {Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';

import {LocationService} from '../base/location.service';

/**
 * 搜索框组件
 */
@Component({
    selector: 'univ-search-box',
    templateUrl: './search-box.component.html'
})
export class SearchBoxComponent implements AfterViewInit {

    private searchDebounce = 300;

    private searchSubject = new Subject<string>();

    @ViewChild('searchBox', {static: true}) searchBox: ElementRef;

    @Output() onSearch = this.searchSubject.pipe(distinctUntilChanged(), debounceTime(this.searchDebounce));

    @Output() onFocus = new EventEmitter<string>();

    private get queryText() {
        return this.searchBox.nativeElement.value;
    }

    private set queryText(queryText: string) {
        this.searchBox.nativeElement.value = queryText;
    }

    constructor(private locationService: LocationService) {

    }

    ngAfterViewInit() {
        const queryText = this.locationService.getSearchParams().search;
        if (queryText) {
            this.queryText = this.decodeQueryText(queryText);
            this.doSearch();
        }
    }

    private decodeQueryText(queryText: string): string {
        return queryText.replace(/\+/g, ' ');
    }

    doSearch() {
        this.searchSubject.next(this.queryText);
    }

    doFocus() {
        this.onFocus.emit(this.queryText);
    }

    focus() {
        this.searchBox.nativeElement.focus();
    }

}
