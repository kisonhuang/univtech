/* eslint-disable @angular-eslint/no-input-rename */
import {Component, AfterViewInit, Input, HostBinding, ViewChild, ElementRef} from '@angular/core';

import {convertInnerHTML} from '../base/security.service';
import {CodeComponent} from './code.component';

/**
 * 代码示例组件，用法如下：
 * ```
 * <univ-code-example header="打印日志" language="typescript" linenum="true">
 * console.log('打印日志');
 * </univ-code-example>
 * 或者：
 * <univ-code-example header="" path="" region=""></univ-code-example>
 * ```
 */
@Component({
    selector: 'univ-code-example',
    templateUrl: './code-example.component.html',
})
export class CodeExampleComponent implements AfterViewInit {

    // 样式：有标题代码，简单代码
    classes: { 'headed-code': boolean, 'simple-code': boolean };

    // 代码标题，显示在代码上方
    private _header: string;

    // 代码语言：javascript、typescript
    @Input() language: string;

    // 是否显示行号，'number'：从这个数字开始显示行号，'true'：显示行号，'false'：不显示行号
    @Input() linenum: string;

    // 代码路径
    private _path = '';

    // 代码显示区域
    @Input() region: string;

    // 是否显示复制按钮，true：显示复制按钮，false：不显示复制按钮
    private _showcopy: boolean;

    // 是否避免文件
    @HostBinding('class.avoidFile') isAvoid = false;

    // 代码内容
    @ViewChild('content', {static: true}) contentElement: ElementRef<HTMLDivElement>;

    // 代码组件
    @ViewChild(CodeComponent, {static: true}) codeComponent: CodeComponent;

    /**
     * 获取代码标题
     *
     * @return string 代码标题
     */
    get header(): string {
        return this._header;
    }

    /**
     * 设置代码标题
     *
     * @param header 代码标题
     */
    @Input() set header(header: string) {
        this._header = header;
        this.classes = {'headed-code': !!this.header, 'simple-code': !this.header};
    }

    /**
     * 获取代码路径
     *
     * @return string 代码路径
     */
    get path(): string {
        return this._path;
    }

    /**
     * 设置代码路径
     *
     * @param path 代码路径
     */
    @Input() set path(path: string) {
        this._path = path;
        this.isAvoid = this.path.indexOf('.avoid.') !== -1;
    }

    /**
     * 获取是否显示复制按钮
     *
     * @return boolean 显示复制按钮
     */
    get showcopy(): boolean {
        return this._showcopy;
    }

    /**
     * 设置是否显示复制按钮
     *
     * @param showcopy 是否显示复制按钮
     */
    @Input() set showcopy(showcopy: boolean) {
        this._showcopy = showcopy != null && `${showcopy}` === 'true';
    }

    /**
     * 设置是否显示复制按钮
     *
     * @param showcopy 是否显示复制按钮
     */
    @Input('showCopy') set showCopyCapitalized(showcopy: boolean) {
        this.showcopy = showcopy;
    }

    /**
     * 设置是否显示复制按钮
     *
     * @param showcopy 是否显示复制按钮
     */
    @Input('show-copy') set showCopyHyphenated(showcopy: boolean) {
        this.showcopy = showcopy;
    }

    /**
     * 组件视图初始化完成之后的回调方法
     */
    ngAfterViewInit() {
        const contentElement = this.contentElement.nativeElement;
        this.codeComponent.codeHtml = convertInnerHTML(contentElement);
        contentElement.textContent = '';
    }

}
