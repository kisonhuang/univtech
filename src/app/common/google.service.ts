import {Inject, Injectable} from '@angular/core';

import {WindowToken} from './window.service';
import {environment} from '../../environments/environment';

/**
 * 调用谷歌分析的服务。<br>
 * 谷歌分析服务：Google Analytics Service。<br>
 * 捕获应用程序的行为并发送到谷歌分析服务。<br>
 * 假设其他页面的脚本加载了谷歌分析服务的脚本。<br>
 * 把数据和环境中配置的谷歌分析服务的ID关联起来。
 */
@Injectable()
export class GoogleService {

    // 上一个页面的路径
    private previousUrl!: string;

    /**
     * 构造函数，创建GaService
     *
     * @param window Window对象
     */
    constructor(@Inject(WindowToken) private window: Window) {
        // 调用谷歌分析的自动创建服务
        this.callGaService('create', environment.gaId, 'auto');
    }

    /**
     * 当前页面发生改变时，调用谷歌分析的设置页面路径和发送页面访问量服务
     *
     * @param url 页面路径
     */
    locationChanged(url: string) {
        this.sendPageview(url);
    }

    /**
     * 调用谷歌分析的设置页面路径和发送页面访问量服务
     *
     * @param url 页面路径
     */
    sendPageview(url: string) {
        // 页面路径没有改变，不重新发送
        if (url === this.previousUrl) {
            return;
        }
        this.previousUrl = url;
        this.callGaService('set', 'page', '/' + url);
        this.callGaService('send', 'pageview');
    }

    /**
     * 调用谷歌分析的发送事件服务
     *
     * @param source 事件源
     * @param action 操作
     * @param label 标签键
     * @param value 标签值
     */
    sendEvent(source: string, action: string, label?: string, value?: number) {
        this.callGaService('send', 'event', source, action, label, value);
    }

    /**
     * 调用谷歌分析服务
     *
     * @param args 服务参数
     */
    callGaService(...args: any[]) {
        const gaFn = (this.window as any).callGaService;
        if (gaFn) {
            gaFn(...args);
        }
    }

}
