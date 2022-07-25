import {Inject, Injectable} from '@angular/core';

import {windowToken} from './window.service';
import {environment} from '../../environments/environment';

/**
 * 谷歌服务，调用谷歌分析的服务。
 * 谷歌分析服务：Google Analytics Service。
 * 捕获应用程序的行为并发送到谷歌分析服务。
 * 假设其他页面的脚本加载了谷歌分析服务的脚本。
 * 把数据和环境中配置的谷歌分析服务的ID关联起来。
 */
@Injectable()
export class GoogleService {

    // 上一个页面的路径
    private previousUrl: string;

    /**
     * 构造函数，创建谷歌服务
     *
     * @param window Window对象
     */
    constructor(@Inject(windowToken) private window: Window) {
        // 调用谷歌分析服务的自动创建服务
        this.callGaFunc('create', environment.gaId, 'auto');
    }

    /**
     * 更新路径，调用谷歌分析服务的设置页面方法和发送页面访问量方法
     *
     * @param url 页面路径
     */
    changeLocation(url: string): void {
        this.sendPageview(url);
    }

    /**
     * 调用谷歌分析服务的设置页面方法和发送页面访问量方法
     *
     * @param url 页面路径
     */
    sendPageview(url: string): void {
        // 页面路径没有发生改变，不需要重新发送
        if (url === this.previousUrl) {
            return;
        }
        this.previousUrl = url;
        this.callGaFunc('set', 'page', '/' + url);
        this.callGaFunc('send', 'pageview');
    }

    /**
     * 调用谷歌分析服务的发送事件方法
     *
     * @param source 事件源
     * @param action 操作
     * @param label 标签键
     * @param value 标签值
     */
    sendEvent(source: string, action: string, label?: string, value?: number): void {
        this.callGaFunc('send', 'event', source, action, label, value);
    }

    /**
     * 调用谷歌分析服务的方法
     *
     * @param params 方法参数
     */
    callGaFunc(...params: any[]): void {
        const gaFunc = (this.window as any).callGaFunc;
        if (gaFunc) {
            gaFunc(...params);
        }
    }

}
