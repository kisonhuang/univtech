import {Component, OnChanges, Input, Output, EventEmitter, ViewChild, ElementRef} from '@angular/core';
import {Clipboard} from '@angular/cdk/clipboard';
import {MatSnackBar} from '@angular/material/snack-bar';

import {Observable, of} from 'rxjs';
import {tap} from 'rxjs/operators';

import {unwrapHtmlForSink} from 'safevalues';
import {htmlFromStringKnownToSatisfyTypeContract} from 'safevalues/unsafe/reviewed';

import {LogService} from '../../base/log.service';
import {convertOuterHTML} from '../../base/security.service';
import {CodePrettyService} from './code-pretty.service';

/**
 * 已格式化代码组件，用法如下：
 * ```
 * <univ-code
 *     [language]="ts"
 *     [linenum]="true"
 *     [path]="router/src/app/app.module.ts"
 *     [region]="animations-module">
 * </univ-code>
 * ```
 */
@Component({
    selector: 'univ-code',
    templateUrl: './code.component.html'
})
export class CodeComponent implements OnChanges {

    // ARIA标签
    ariaLabel = '';

    // 代码HTML，视图中显示的当前输入的已格式化代码
    _codeHtml: TrustedHTML;

    // 代码文本，点击复制按钮时复制的非HTML编码代码
    private codeText: string;

    // 代码标题，显示在代码上方
    private _header: string | undefined;

    // 代码语言：javascript、typescript
    @Input() language: string | undefined;

    // 是否显示行号，number或'number'：从这个数字开始显示行号，true或'true'：显示行号，false或'false'：不显示行号
    @Input() linenum: boolean | number | string | undefined;

    // 代码路径
    @Input() path: string;

    // 代码显示区域
    @Input() region: string;

    // 是否显示复制按钮
    @Input() shownCopy: boolean;

    // 代码格式化完成事件
    @Output() codeFormatted = new EventEmitter<void>();

    // 模板中的元素，用于显示已格式化代码
    @ViewChild('codeContainer', {static: true}) codeContainer: ElementRef;

    /**
     * 获取可信任的代码HTML
     *
     * @return TrustedHTML 可信任的代码HTML
     */
    get codeHtml(): TrustedHTML {
        return this._codeHtml;
    }

    /**
     * 设置可信任的代码HTML
     *
     * @param codeHtml 可信任的代码HTML
     */
    set codeHtml(codeHtml: TrustedHTML) {
        this._codeHtml = codeHtml;
        if (!this._codeHtml.toString().trim()) {
            this.showCodeMissing();
        } else {
            this.formatCodeHtml();
        }
    }

    /**
     * 获取代码标题
     *
     * @return string或undefined 代码标题
     */
    get header(): string | undefined {
        return this._header;
    }

    /**
     * 设置代码标题
     *
     * @param header 代码标题
     */
    @Input() set header(header: string | undefined) {
        this._header = header;
        this.ariaLabel = this.header ? `复制代码：${this.header}` : '';
    }

    /**
     * 构造函数，创建已格式化代码组件
     *
     * @param clipboard 剪贴板
     * @param matSnackBar 提示信息栏
     * @param logService 日志服务
     * @param codePrettyService 代码美化服务
     */
    constructor(private clipboard: Clipboard,
                private matSnackBar: MatSnackBar,
                private logService: LogService,
                private codePrettyService: CodePrettyService) {

    }

    /**
     * 数据绑定属性发生改变时的回调方法
     */
    ngOnChanges() {
        if (this._codeHtml) {
            this.formatCodeHtml();
        }
    }

    /**
     * 格式化已显示代码
     */
    private formatCodeHtml() {
        const linenum = this.getLinenum();
        const alignedCode = alignLeft(this._codeHtml);
        this.setCodeHtml(alignedCode);
        this.codeText = this.getCodeText();

        const skipPrettify = of(undefined);
        const prettyCode = this.codePrettyService.formatCode(alignedCode, this.language, linenum).pipe(tap(formattedCode => this.setCodeHtml(formattedCode)));

        if (this.language === 'none' && linenum !== false) {
            this.logService.warn('不支持：language=none并且linenum!=false');
        }

        ((this.language === 'none' ? skipPrettify : prettyCode) as Observable<unknown>).subscribe({
            next: () => this.codeFormatted.emit(),
            error: () => {

            },
        });
    }

    /**
     * 显示示例代码缺失信息
     */
    private showCodeMissing() {
        const src = this.path ? this.path + (this.region ? '#' + this.region : '') : '';
        const paraElement = document.createElement('p');
        paraElement.className = 'code-missing';
        paraElement.textContent = `缺失示例代码${src ? `\n${src}` : '。'}`;
        this.setCodeHtml(convertOuterHTML(paraElement));
    }

    /**
     * 设置可信任的代码HTML
     *
     * @param codeHtml 已可信任的代码HTML
     */
    private setCodeHtml(codeHtml: TrustedHTML) {
        this.codeContainer.nativeElement.innerHTML = unwrapHtmlForSink(codeHtml);
    }

    /**
     * 获取代码文本
     */
    private getCodeText() {
        return this.codeContainer.nativeElement.textContent;
    }

    /**
     * 获取行号
     *
     * @return number或boolean number：从这个数字开始显示行号，true：显示行号，false：不显示行号
     */
    getLinenum() {
        const linenum = this.getLinenumValue();
        return (linenum != null) && !isNaN(linenum as number) && linenum;
    }

    /**
     * 获取行号
     *
     * @return number或boolean number：从这个数字开始显示行号，true：显示行号，false：不显示行号
     */
    private getLinenumValue() {
        if (typeof this.linenum === 'boolean') {
            return this.linenum;
        } else if (this.linenum === 'true') {
            return true;
        } else if (this.linenum === 'false') {
            return false;
        } else if (typeof this.linenum === 'string') {
            return parseInt(this.linenum, 10);
        } else {
            return this.linenum;
        }
    }

    /**
     * 复制代码
     */
    copyCode() {
        const code = this.codeText;
        const result = this.clipboard.copy(code);
        if (result) {
            this.logService.log('代码复制成功：', code);
            this.matSnackBar.open('代码复制成功', '', {duration: 800});
        } else {
            this.logService.error(new Error(`代码复制失败："${code}"`));
            this.matSnackBar.open('代码复制失败', '', {duration: 800});
        }
    }

}

/**
 * 左对齐HTML
 *
 * @param codeHtml 可信任的代码HTML
 * @return TrustedHTML 可信任的代码HTML
 */
function alignLeft(codeHtml: TrustedHTML): TrustedHTML {
    let indent = Number.MAX_VALUE;
    const lines = codeHtml.toString().split('\n');
    lines.forEach(line => {
        const lineIndent = line.search(/\S/);
        if (lineIndent !== -1) {
            indent = Math.min(lineIndent, indent);
        }
    });
    return htmlFromStringKnownToSatisfyTypeContract(lines.map(line => line.slice(indent)).join('\n').trim(), '现有可信任HTML的安全操作');
}
