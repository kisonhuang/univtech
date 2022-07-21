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
            <aio-search-results class="embedded" [searchResults]="searchResults | async"></aio-search-results>`
})
export class FileNotFoundSearchComponent implements OnInit {
    searchResults: Observable<SearchResults>;

    constructor(private location: LocationService, private search: SearchService) {
    }

    ngOnInit() {
        this.searchResults = this.location.currentPath.pipe(switchMap(path => {
            const query = path.split(/\W+/).join(' ');
            return this.search.search(query);
        }));
    }
}
