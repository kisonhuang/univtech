import {Injectable} from '@angular/core';

import {LocationService} from './location.service';
import {environment} from '../../environments/environment';

/**
 * 部署服务
 */
@Injectable()
export class DeploymentService {

    // mode查询参数（例如：...?mode=archive）中设置的部署模式，或构建时提供的environment中设置的部署模式
    mode: string = this.locationService.getSearchParams().mode || environment.mode;

    /**
     * 构造函数，创建部署服务
     *
     * @param locationService 地址服务
     */
    constructor(private locationService: LocationService) {

    }

}
