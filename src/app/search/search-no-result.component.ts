import {Component, OnInit} from '@angular/core';

import {Observable} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {LocationService} from '../base/location.service';
import {SearchResults} from './search.model';
import {SearchService} from './search.service';

@Component({
    selector: 'univ-search-no-result',
    templateUrl: './search-no-result.component.html'
})
export class SearchNoResultComponent implements OnInit {

    searchResults: Observable<SearchResults>;

    constructor(private locationService: LocationService, private searchService: SearchService) {

    }

    ngOnInit() {
        this.searchResults = this.locationService.currentPathObservable.pipe(switchMap(path => {
            const queryText = path.split(/\W+/).join(' ');
            return this.searchService.searchIndex(queryText);
        }));
    }
}
