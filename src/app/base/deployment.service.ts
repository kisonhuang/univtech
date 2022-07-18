import {Injectable} from '@angular/core';

import {LocationService} from './location.service';
import {environment} from '../../environments/environment';

@Injectable()
export class DeploymentService {

    mode: string = this.locationService.search().mode || environment.mode;

    constructor(private locationService: LocationService) {

    }

}
