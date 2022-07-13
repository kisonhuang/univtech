// 这个文件是karma.conf.js所需的，用于递归加载所有.spec和框架文件

import 'zone.js/testing';
import {getTestBed} from '@angular/core/testing';
import {BrowserDynamicTestingModule, platformBrowserDynamicTesting} from '@angular/platform-browser-dynamic/testing';

// assert腻子脚本使用process时所需的
// 参考：https://github.com/browserify/commonjs-assert/blob/bba838e9ba9e28edf3127ce6974624208502f6bc/internal/assert/assertion_error.js#L138
// 需要assert腻子脚本的原因在于，timezone-mock既是一个Node.JS库，却又被浏览器所使用
(globalThis as any).process = {
    env: {},
};

declare const require: {
    context(path: string, deep?: boolean, filter?: RegExp): {
        <T>(id: string): T;
        keys(): string[];
    };
};

// 初始化Angular测试环境
getTestBed().initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
);

// 找出所有测试，并加载模块
const context = require.context('./', true, /\.spec\.ts$/);
context.keys().forEach(context);
