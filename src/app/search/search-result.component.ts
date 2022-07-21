import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';

import {SearchState, SearchResult, SearchResults, SearchResultArea} from './search.model';

/**
 * A component to display search results in groups
 */
@Component({
    selector: 'univ-search-result',
    templateUrl: './search-result.component.html',
})
export class SearchResultComponent implements OnChanges {

    // 搜索结果
    @Input() searchResults: SearchResults | null = null;

    // 选择搜索结果事件
    @Output() resultSelected = new EventEmitter<SearchResult>();

    // 点击关闭按钮事件
    @Output() closeButtonClick = new EventEmitter<void>();

    // 搜索状态
    searchState: SearchState = SearchState.InProgress;

    readonly defaultArea = 'other';

    readonly folderToAreaMap: Record<string, string> = {
        api: 'api',
        cli: 'cli',
        docs: 'guides',
        errors: 'errors',
        guide: 'guides',
        start: 'tutorials',
        tutorial: 'tutorials',
    };

    // 搜索结果区域
    searchResultAreas: SearchResultArea[] = [];

    ngOnChanges() {
        if (this.searchResults === null) {
            this.searchState = SearchState.InProgress;
        } else if (this.searchResults.results.length) {
            this.searchState = SearchState.HasResult;
        } else {
            this.searchState = SearchState.HasNoResult;
        }
        this.searchResultAreas = this.processSearchResults(this.searchResults);
    }

    onResultSelected(selectedPage: SearchResult, event: MouseEvent) {
        if (event.button === 0 && !event.ctrlKey && !event.metaKey) {
            this.resultSelected.emit(selectedPage);
        }
    }

    onCloseClicked() {
        this.closeButtonClick.emit();
    }

    private processSearchResults(searchResults: SearchResults | null) {
        if (!searchResults) {
            return [];
        }

        const searchResultMap: { [key: string]: SearchResult[] } = {};
        searchResults.results.forEach(searchResult => {
            if (!searchResult.title) {
                return;
            }
            const areaName = this.computeAreaName(searchResult);
            const searchResultArray = searchResultMap[areaName] = searchResultMap[areaName] || [];
            searchResultArray.push(searchResult);
        });

        const keys = Object.keys(searchResultMap).sort((first, second) => first > second ? 1 : -1);
        return keys.map(name => {
            const {priorityPages, pages, deprecated} = splitPages(searchResultMap[name]);
            return {
                name,
                priorityPages,
                pages: pages.concat(deprecated),
            };
        });
    }

    private computeAreaName(searchResult: SearchResult): string {
        const [folder] = searchResult.path.split('/', 1);
        return this.folderToAreaMap[folder] ?? this.defaultArea;
    }
}

function splitPages(searchResults: SearchResult[]) {
    const priorityPages: SearchResult[] = [];
    const pages: SearchResult[] = [];
    const deprecated: SearchResult[] = [];
    searchResults.forEach(searchResult => {
        if (searchResult.deprecated) {
            deprecated.push(searchResult);
        } else if (priorityPages.length < 5) {
            priorityPages.push(searchResult);
        } else {
            pages.push(searchResult);
        }
    });
    while (priorityPages.length < 5 && pages.length) {
        priorityPages.push(pages.shift() as SearchResult);
    }
    while (priorityPages.length < 5 && deprecated.length) {
        priorityPages.push(deprecated.shift() as SearchResult);
    }
    pages.sort(compareResults);

    return {priorityPages, pages, deprecated};
}

function compareResults(first: SearchResult, second: SearchResult) {
    return first.title.toUpperCase() > second.title.toUpperCase() ? 1 : -1;
}
