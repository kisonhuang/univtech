import {Injectable, Inject, Type, NgModuleRef, createNgModuleRef} from '@angular/core';
import {createCustomElement} from '@angular/elements';
import {LoadChildrenCallback} from '@angular/router';

import {Observable, from, of} from 'rxjs';

import {ElementComponentModuleToken, ElementComponentModule} from './element-registry.service';

/**
 * 元素加载服务
 */
@Injectable()
export class ElementLoadService {

    // 未加载的元素组件模块映射
    private unloadedElementComponentModuleMap: Map<string, LoadChildrenCallback>;

    // 正在加载的元素组件模块映射
    private loadingElementComponentModuleMap = new Map<string, Promise<void>>();

    /**
     * 构造函数，创建元素加载服务
     *
     * @param ngModuleRef 模块应用
     * @param elementComponentModuleMap 元素组件模块映射
     */
    constructor(private ngModuleRef: NgModuleRef<any>,
                @Inject(ElementComponentModuleToken) elementComponentModuleMap: Map<string, LoadChildrenCallback>) {
        this.unloadedElementComponentModuleMap = new Map(elementComponentModuleMap);
    }

    /**
     * 加载未注册到浏览器的元素
     *
     * @param element HTML元素
     * @return Observable<void> 所有元素加载完成主题
     */
    loadElementComponentModules(element: HTMLElement): Observable<void> {
        const unloadedSelectors = Array.from(this.unloadedElementComponentModuleMap.keys()).filter(selector => element.querySelector(selector));
        if (!unloadedSelectors.length) {
            return of(undefined);
        }

        const loadComplete = Promise.all(unloadedSelectors.map(selector => this.loadElementComponentModule(selector)));
        return from(loadComplete.then(() => undefined));
    }

    /**
     * 加载未注册到浏览器的元素
     *
     * @param selector 元素选择器
     */
    loadElementComponentModule(selector: string): Promise<void> {
        if (this.loadingElementComponentModuleMap.has(selector)) {
            return this.loadingElementComponentModuleMap.get(selector) as Promise<void>;
        }

        if (this.unloadedElementComponentModuleMap.has(selector)) {
            const unloadedElementComponentModule = this.unloadedElementComponentModuleMap.get(selector) as LoadChildrenCallback;
            const loadedElementComponentModulePromise = (unloadedElementComponentModule() as Promise<Type<ElementComponentModule>>)
                .then(elementComponentModule => {
                    const elementComponentModuleRef = createNgModuleRef(elementComponentModule, this.ngModuleRef.injector);
                    const injector = elementComponentModuleRef.injector;
                    const customElementComponent = elementComponentModuleRef.instance.elementComponent;
                    const customElement = createCustomElement(customElementComponent, {injector});

                    customElements.define(selector, customElement);
                    return customElements.whenDefined(selector);
                })
                .then(() => {
                    this.loadingElementComponentModuleMap.delete(selector);
                    this.unloadedElementComponentModuleMap.delete(selector);
                })
                .catch(error => {
                    this.loadingElementComponentModuleMap.delete(selector);
                    return Promise.reject(error);
                });

            this.loadingElementComponentModuleMap.set(selector, loadedElementComponentModulePromise);
            return loadedElementComponentModulePromise;
        }

        return Promise.resolve();
    }

}
