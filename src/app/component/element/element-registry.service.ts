import {InjectionToken, Type} from '@angular/core';
import {LoadChildrenCallback} from '@angular/router';

// 元素模块路由
export const ElementModuleRoutes = [
    // {
    //     selector: 'aio-file-not-found-search',
    //     loadChildren: () => import('./search/file-not-found-search.module').then(m => m.FileNotFoundSearchModule)
    // },
    // {
    //     selector: 'aio-toc',
    //     loadChildren: () => import('./toc/toc.module').then(m => m.TocModule)
    // },
    {
        selector: 'univ-code-example',
        loadChildren: () => import('../code/code-example.module').then(module => module.CodeExampleModule),
    },
    {
        selector: 'univ-code-tab',
        loadChildren: () => import('../code/code-tab.module').then(module => module.CodeTabModule),
    },
];

/**
 * 元素模块接口，由声明元素组件的模块实现
 */
export interface ElementModule {

    elementComponent: Type<any>;

}

// 元素模块映射令牌
export const ElementModuleToken = new InjectionToken<Map<string, LoadChildrenCallback>>('ElementModuleMap');

// 元素模块映射
export const ElementModuleMap = new Map<string, LoadChildrenCallback>();

// 把元素模块路由转换为元素选择器与延时加载模块之间的映射
ElementModuleRoutes.forEach(route => {
    ElementModuleMap.set(route.selector, route.loadChildren);
});
