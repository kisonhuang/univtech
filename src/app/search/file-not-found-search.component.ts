import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {LocationService} from '../base/location.service';
import {SearchResults} from './search.model';
import {SearchService} from './search.service';

@Component({
    selector: 'univ-file-not-found-search',
    template:
        `
            <div class="alert is-helpful">
                <p>Let's see if any of these search results help...</p>
            </div>
            <univ-search-result class="embedded" [searchResults]="searchResults | async"></univ-search-result>`
})
export class FileNotFoundSearchComponent implements OnInit {
    searchResults: Observable<SearchResults>;

    constructor(private location: LocationService, private searchService: SearchService) {
    }

    ngOnInit() {
        this.searchResults = this.location.currentPath.pipe(switchMap(path => {
            const queryText = path.split(/\W+/).join(' ');
            return this.searchService.searchIndex(queryText);
        }));
    }
}
