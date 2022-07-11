import {Injectable} from '@angular/core';

import {LocationService} from './location.service';
import {environment} from '../../environments/environment';

/**
 * 应用程序的部署信息
 */
@Injectable()
export class Deployment {

    // mode查询参数（例如：...?mode=archive）中设置的部署模式，或者构建时提供的environment中设置的部署模式
    mode: string = this.location.search()['mode'] || environment.mode;

    constructor(private location: LocationService) {

    }

}
