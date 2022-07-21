import {Type, InjectionToken} from '@angular/core';
import {LoadChildrenCallback} from '@angular/router';

// 元素组件模块接口，由声明元素组件的模块实现
export interface ElementComponentModule {
    elementComponent: Type<any>; // 元素组件
}

// 元素组件模块令牌
export const ElementComponentModuleToken = new InjectionToken<Map<string, LoadChildrenCallback>>('ElementComponentModuleMap');

// 元素组件模块映射
export const ElementComponentModuleMap = new Map<string, LoadChildrenCallback>();

// 元素组件模块路由
export const ElementComponentModuleRoutes = [
    {selector: 'univ-code-example', loadChildren: () => import('../code/code-example.module').then(module => module.CodeExampleModule)},
    {selector: 'univ-code-tab', loadChildren: () => import('../code/code-tab.module').then(module => module.CodeTabModule)},
    {selector: 'univ-search-no-result', loadChildren: () => import('../search/search-no-result.module').then(module => module.SearchNoResultModule)},
    // {
    //     selector: 'aio-toc',
    //     loadChildren: () => import('./toc/toc.module').then(m => m.TocModule)
    // },
];

// 元素组件模块路由转换为元素组件选择器与延时加载的元素组件模块之间的映射
ElementComponentModuleRoutes.forEach(route => {
    ElementComponentModuleMap.set(route.selector, route.loadChildren);
});
