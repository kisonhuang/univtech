import {Injectable, Inject, Type, NgModuleRef, createNgModuleRef} from '@angular/core';
import {createCustomElement} from '@angular/elements';
import {LoadChildrenCallback} from '@angular/router';

import {Observable, from, of} from 'rxjs';

import {ElementModuleToken, ElementModule} from './element-registry.service';

/**
 * 元素加载服务
 */
@Injectable()
export class ElementLoadService {

    // 未加载元素模块映射
    private unloadedElementModuleMap: Map<string, LoadChildrenCallback>;

    // 正在加载的元素模块映射
    private loadingElementModuleMap = new Map<string, Promise<void>>();

    /**
     * 构造函数，创建元素加载服务
     *
     * @param ngModuleRef 模块应用
     * @param elementModuleMap 元素模块映射
     */
    constructor(private ngModuleRef: NgModuleRef<any>,
                @Inject(ElementModuleToken) elementModuleMap: Map<string, LoadChildrenCallback>) {
        this.unloadedElementModuleMap = new Map(elementModuleMap);
    }

    /**
     * 加载未注册到浏览器的元素
     *
     * @param element HTML元素
     * @return Observable<void> 发现的所有元素都已加载完成的可观察对象
     */
    loadElementModules(element: HTMLElement): Observable<void> {
        const unloadedSelectors = Array.from(this.unloadedElementModuleMap.keys()).filter(selector => element.querySelector(selector));
        if (!unloadedSelectors.length) {
            return of(undefined);
        }

        const loadComplete = Promise.all(unloadedSelectors.map(selector => this.loadElementModule(selector)));
        return from(loadComplete.then(() => undefined));
    }

    /**
     * 加载未注册到浏览器的元素
     *
     * @param selector 元素选择器
     */
    loadElementModule(selector: string): Promise<void> {
        if (this.loadingElementModuleMap.has(selector)) {
            return this.loadingElementModuleMap.get(selector) as Promise<void>;
        }

        if (this.unloadedElementModuleMap.has(selector)) {
            const unloadedElementModule = this.unloadedElementModuleMap.get(selector) as LoadChildrenCallback;
            const loadedElementModulePromise = (unloadedElementModule() as Promise<Type<ElementModule>>)
                .then(elementModule => {
                    const elementModuleRef = createNgModuleRef(elementModule, this.ngModuleRef.injector);
                    const injector = elementModuleRef.injector;
                    const customElementComponent = elementModuleRef.instance.elementComponent;
                    const customElement = createCustomElement(customElementComponent, {injector});

                    customElements.define(selector, customElement);
                    return customElements.whenDefined(selector);
                })
                .then(() => {
                    this.loadingElementModuleMap.delete(selector);
                    this.unloadedElementModuleMap.delete(selector);
                })
                .catch(error => {
                    this.loadingElementModuleMap.delete(selector);
                    return Promise.reject(error);
                });

            this.loadingElementModuleMap.set(selector, loadedElementModulePromise);
            return loadedElementModulePromise;
        }

        return Promise.resolve();
    }

}
